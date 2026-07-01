import { getApplicationStore, getStorageBackend } from '../database/storage';
import { withTransaction } from '../database';
import { createApplicationEvent, findApplicationEvents } from '../database/repositories/application-event.repository';
import { findUserByTelegramId } from '../database/repositories/user.repository';
import {
  buildNotificationContent,
  getApplicationStatusLabel,
  notifyApplicationStatusChange,
  sendNotificationMessage,
} from './application-status.service';
import { logStatusChanged } from './activity-log.service';
import { checkDocumentsCompleted } from './requirement.service';
import { ApplicationEvent } from '../types/events';
import { Language } from '../types';
import { Application, ApplicationStatus } from '../universities/types';
import { getUniversityById } from '../universities/university.service';
import { t } from '../i18n';

export async function getApplicationTimeline(
  applicationId: number,
): Promise<ApplicationEvent[]> {
  return findApplicationEvents(applicationId);
}

export async function transitionApplicationStatus(params: {
  applicationId: number;
  newStatus: ApplicationStatus;
  changedBy?: number | null;
  language?: Language;
  notify?: boolean;
  skipDocumentsCheck?: boolean;
}): Promise<{ success: boolean; application?: Application; previousStatus?: ApplicationStatus }> {
  if (getStorageBackend() === 'postgres') {
    return transitionApplicationStatusPostgres(params);
  }

  const existing = await getApplicationStore().findByIdOnly(params.applicationId);
  if (!existing) return { success: false };

  const previousStatus = existing.status;
  if (previousStatus === params.newStatus) {
    return { success: true, application: existing, previousStatus };
  }

  const result = await getApplicationStore().updateStatusById(
    params.applicationId,
    params.newStatus,
  );
  if (!result) return { success: false };

  const { application } = result;

  await createApplicationEvent({
    application_id: application.id,
    telegram_id: application.telegram_id,
    event_type: 'status_change',
    from_status: previousStatus,
    to_status: params.newStatus,
    changed_by: params.changedBy ?? null,
  });

  await logStatusChanged(
    application.telegram_id,
    application.id,
    previousStatus,
    params.newStatus,
    params.changedBy,
  );

  if (params.notify !== false) {
    const user = await findUserByTelegramId(application.telegram_id);
    const language = params.language ?? user?.language ?? 'en';
    await notifyApplicationStatusChange(application, previousStatus, language);
  }

  if (!params.skipDocumentsCheck && params.newStatus !== 'documents_completed') {
    const completed = await checkDocumentsCompleted(application);
    if (completed && application.status !== 'documents_completed') {
      return transitionApplicationStatus({
        ...params,
        newStatus: 'documents_completed',
        skipDocumentsCheck: true,
      });
    }
  }

  return { success: true, application, previousStatus };
}

interface ApplicationRow {
  id: number;
  telegram_id: string;
  university_id: string;
  country: Application['country'];
  degree: Application['degree'];
  status: ApplicationStatus;
  created_at: Date;
  updated_at: Date;
}

function mapApplicationRow(row: ApplicationRow): Application {
  return {
    ...row,
    telegram_id: Number(row.telegram_id),
  };
}

async function buildStatusNotification(
  application: Application,
  previousStatus: ApplicationStatus,
  language: Language,
): Promise<{ title: string; message: string }> {
  const texts = t(language);
  const university = await getUniversityById(application.university_id, language);
  const universityName = university?.name ?? application.university_id;
  const previousLabel = getApplicationStatusLabel(language, previousStatus);
  const newLabel = getApplicationStatusLabel(language, application.status);

  return buildNotificationContent(
    texts.notificationStatusChangeTitle,
    texts.notificationStatusChangeMessage(universityName, previousLabel, newLabel),
  );
}

async function transitionApplicationStatusPostgres(params: {
  applicationId: number;
  newStatus: ApplicationStatus;
  changedBy?: number | null;
  language?: Language;
  notify?: boolean;
  skipDocumentsCheck?: boolean;
}): Promise<{ success: boolean; application?: Application; previousStatus?: ApplicationStatus }> {
  const transition = await withTransaction(async (client) => {
    let notificationToSend:
      | { userId: number; title: string; message: string }
      | null = null;

    const existingResult = await client.query<ApplicationRow>(
      `SELECT * FROM applications WHERE id = $1 FOR UPDATE`,
      [params.applicationId],
    );
    const existingRow = existingResult.rows[0];
    if (!existingRow) return { success: false as const };

    const existing = mapApplicationRow(existingRow);
    const previousStatus = existing.status;
    if (previousStatus === params.newStatus) {
      return { success: true as const, application: existing, previousStatus };
    }

    const updatedResult = await client.query<ApplicationRow>(
      `UPDATE applications
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [params.applicationId, params.newStatus],
    );
    const updatedRow = updatedResult.rows[0];
    if (!updatedRow) return { success: false as const };

    const application = mapApplicationRow(updatedRow);

    await client.query(
      `INSERT INTO application_events (
         application_id, telegram_id, event_type,
         from_status, to_status, changed_by, message
       )
       VALUES ($1, $2, 'status_change', $3, $4, $5, NULL)`,
      [
        application.id,
        application.telegram_id,
        previousStatus,
        params.newStatus,
        params.changedBy ?? null,
      ],
    );

    await client.query(
      `INSERT INTO activity_logs (
         telegram_id, actor_telegram_id, action, entity_type, entity_id, metadata
       )
       VALUES ($1, $2, 'status_changed', 'application', $3, $4)`,
      [
        application.telegram_id,
        params.changedBy ?? application.telegram_id,
        application.id,
        JSON.stringify({ fromStatus: previousStatus, toStatus: params.newStatus }),
      ],
    );

    if (params.notify !== false) {
      const userResult = await client.query<{ language: Language }>(
        `SELECT language FROM users WHERE telegram_id = $1`,
        [application.telegram_id],
      );
      const language = params.language ?? userResult.rows[0]?.language ?? 'en';
      const notification = await buildStatusNotification(application, previousStatus, language);

      await client.query(
        `INSERT INTO notifications (user_id, title, message, application_id)
         VALUES ($1, $2, $3, $4)`,
        [application.telegram_id, notification.title, notification.message, application.id],
      );

      notificationToSend = {
        userId: application.telegram_id,
        title: notification.title,
        message: notification.message,
      };
    }

    return { success: true as const, application, previousStatus, notificationToSend };
  });

  if (!transition.success) return transition;

  if (transition.notificationToSend) {
    await sendNotificationMessage(
      transition.notificationToSend.userId,
      transition.notificationToSend.title,
      transition.notificationToSend.message,
    );
  }

  if (
    !params.skipDocumentsCheck &&
    params.newStatus !== 'documents_completed' &&
    transition.application
  ) {
    const completed = await checkDocumentsCompleted(transition.application);
    if (completed && transition.application.status !== 'documents_completed') {
      return transitionApplicationStatus({
        ...params,
        newStatus: 'documents_completed',
        skipDocumentsCheck: true,
      });
    }
  }

  return transition;
}

export async function recordInitialApplicationEvent(application: Application): Promise<void> {
  await createApplicationEvent({
    application_id: application.id,
    telegram_id: application.telegram_id,
    event_type: 'status_change',
    from_status: null,
    to_status: application.status,
    changed_by: null,
    message: 'Application submitted',
  });
}
