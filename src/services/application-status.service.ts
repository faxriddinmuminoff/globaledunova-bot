import { Telegraf } from 'telegraf';
import { Language } from '../types';
import { t } from '../i18n';
import { Application, ApplicationStatus } from '../universities/types';
import { getUniversityById } from '../universities/catalog';
import { createNotification } from '../database/repositories/notification.repository';
import { logger } from '../logger';

let botInstance: Telegraf | null = null;

export function setNotificationBot(bot: Telegraf): void {
  botInstance = bot;
}

export function getApplicationStatusLabel(
  language: Language,
  status: ApplicationStatus,
): string {
  return t(language).applicationStatuses[status];
}

export async function deliverNotification(
  userId: number,
  title: string,
  message: string,
  applicationId?: number,
): Promise<void> {
  await createNotification({
    user_id: userId,
    title,
    message,
    application_id: applicationId,
  });

  if (!botInstance) {
    logger.warn({ userId }, 'Bot instance not set — notification stored but not delivered via Telegram');
    return;
  }

  try {
    await botInstance.telegram.sendMessage(
      userId,
      `📬 *${title}*\n\n${message}`,
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send Telegram notification');
  }
}

export async function notifyApplicationStatusChange(
  application: Application,
  previousStatus: ApplicationStatus,
  language: Language,
): Promise<void> {
  if (previousStatus === application.status) return;

  const texts = t(language);
  const university = getUniversityById(application.university_id, language);
  const universityName = university?.name ?? application.university_id;
  const previousLabel = getApplicationStatusLabel(language, previousStatus);
  const newLabel = getApplicationStatusLabel(language, application.status);

  const title = texts.notificationStatusChangeTitle;
  const message = texts.notificationStatusChangeMessage(
    universityName,
    previousLabel,
    newLabel,
  );

  await deliverNotification(application.telegram_id, title, message, application.id);
}

export async function notifyApplicationSubmitted(
  application: Application,
  language: Language,
): Promise<void> {
  const texts = t(language);
  const university = getUniversityById(application.university_id, language);
  const universityName = university?.name ?? application.university_id;
  const statusLabel = getApplicationStatusLabel(language, application.status);

  const title = texts.notificationApplicationSubmittedTitle;
  const message = texts.notificationApplicationSubmittedMessage(universityName, statusLabel);

  await deliverNotification(application.telegram_id, title, message, application.id);
}
