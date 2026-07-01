import { getApplicationStore } from '../database/storage';
import { findDocumentsByApplicationId } from '../database/repositories/document.repository';
import { hasApplicationEventType, createApplicationEvent } from '../database/repositories/application-event.repository';
import { getStorageBackend } from '../database/storage';
import { queryOne } from '../database';
import { getMissingRequiredDocuments } from './requirement.service';
import { deliverNotification } from './application-status.service';
import { notifyManagerNewApplication } from './manager-alert.service';
import { findApplicationWithStudentById } from '../database/repositories/admin.repository';
import { logger } from '../logger';
import { t } from '../i18n';
import { Language } from '../types';
import { ApplicationEventType } from '../types/events';

const DAY_MS = 24 * 60 * 60 * 1000;

async function getLastDocumentUploadDate(applicationId: number): Promise<Date | null> {
  const docs = await findDocumentsByApplicationId(applicationId);
  if (docs.length === 0) return null;
  return docs.reduce(
    (latest, doc) => (doc.uploaded_at > latest ? doc.uploaded_at : latest),
    docs[0].uploaded_at,
  );
}

async function daysSince(date: Date | null, reference = new Date()): Promise<number> {
  if (!date) return Infinity;
  return Math.floor((reference.getTime() - date.getTime()) / DAY_MS);
}

export async function processDocumentReminders(): Promise<void> {
  const applications = await getApplicationStore().findRecent(500);

  for (const application of applications) {
    if (!['submitted', 'reviewing', 'documents_required'].includes(application.status)) {
      continue;
    }

    const missing = await getMissingRequiredDocuments(
      application.university_id,
      await findDocumentsByApplicationId(application.id),
    );
    if (missing.length === 0) continue;

    const lastUpload = await getLastDocumentUploadDate(application.id);
    const referenceDate = lastUpload ?? application.created_at;
    const days = await daysSince(referenceDate);

    try {
      if (days >= 14) {
        if (
          await createReminderEventOnce(
            application.id,
            application.telegram_id,
            'reminder_14d_manager',
            '14-day manager alert: missing documents',
          )
        ) {
          const enriched = await findApplicationWithStudentById(application.id);
          if (enriched) await notifyManagerNewApplication(enriched);
        }
        continue;
      }

      if (days >= 7) {
        if (
          await createReminderEventOnce(
            application.id,
            application.telegram_id,
            'reminder_7d',
            '7-day document reminder',
          )
        ) {
          await sendStudentReminder(application.telegram_id, application.id, 7);
        }
        continue;
      }

      if (days >= 3) {
        if (
          await createReminderEventOnce(
            application.id,
            application.telegram_id,
            'reminder_3d',
            '3-day document reminder',
          )
        ) {
          await sendStudentReminder(application.telegram_id, application.id, 3);
        }
      }
    } catch (error) {
      logger.error({ error, applicationId: application.id }, 'Reminder processing failed');
    }
  }
}

async function createReminderEventOnce(
  applicationId: number,
  telegramId: number,
  eventType: Extract<ApplicationEventType, 'reminder_3d' | 'reminder_7d' | 'reminder_14d_manager'>,
  message: string,
): Promise<boolean> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO application_events (application_id, telegram_id, event_type, message)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (application_id, event_type)
       WHERE event_type IN ('reminder_3d', 'reminder_7d', 'reminder_14d_manager')
       DO NOTHING
       RETURNING id`,
      [applicationId, telegramId, eventType, message],
    );
    return row !== null;
  }

  if (await hasApplicationEventType(applicationId, eventType)) {
    return false;
  }

  await createApplicationEvent({
    application_id: applicationId,
    telegram_id: telegramId,
    event_type: eventType,
    message,
  });
  return true;
}

async function sendStudentReminder(
  telegramId: number,
  applicationId: number,
  days: number,
): Promise<void> {
  const language: Language = 'en';
  const texts = t(language);
  await deliverNotification(
    telegramId,
    texts.documentReminderTitle,
    texts.documentReminderMessage(days),
    applicationId,
  );
}

export function startReminderScheduler(intervalMs = 6 * 60 * 60 * 1000): NodeJS.Timeout {
  const run = () => {
    processDocumentReminders().catch((error) => {
      logger.error({ error }, 'Scheduled reminder job failed');
    });
  };

  run();
  return setInterval(run, intervalMs);
}
