import { Telegraf } from 'telegraf';
import { Language } from '../types';
import { t } from '../i18n';
import { Application, ApplicationStatus } from '../universities/types';
import { getUniversityById } from '../universities/university.service';
import { createNotification } from '../database/repositories/notification.repository';
import { logger } from '../logger';
import { shouldUseTestNotifications } from './soft-launch.service';
import { sendTelegramMessage } from '../telegram/telegram-client';
import { safeMarkdown } from '../security/markdown';

let botInstance: Telegraf | null = null;

export function setNotificationBot(bot: Telegraf): void {
  botInstance = bot;
}

export function getNotificationBot(): Telegraf | null {
  return botInstance;
}

export function getApplicationStatusLabel(
  language: Language,
  status: ApplicationStatus,
): string {
  return t(language).applicationStatuses[status];
}

export async function buildNotificationContent(
  title: string,
  message: string,
): Promise<{ title: string; message: string }> {
  const testMode = await shouldUseTestNotifications();
  return {
    title: testMode ? `[TEST] ${title}` : title,
    message: testMode ? `[SOFT LAUNCH]\n${message}` : message,
  };
}

export async function sendNotificationMessage(
  userId: number,
  title: string,
  message: string,
): Promise<boolean> {
  if (!botInstance) {
    logger.warn({ userId }, 'Bot instance not set — notification stored but not delivered via Telegram');
    return false;
  }

  return sendTelegramMessage({
    bot: botInstance,
    chatId: userId,
    text: `📬 *${safeMarkdown(title)}*\n\n${safeMarkdown(message)}`,
    extra: { parse_mode: 'Markdown' },
  });
}

export async function deliverNotification(
  userId: number,
  title: string,
  message: string,
  applicationId?: number,
): Promise<void> {
  const { title: displayTitle, message: displayMessage } =
    await buildNotificationContent(title, message);

  await createNotification({
    user_id: userId,
    title: displayTitle,
    message: displayMessage,
    application_id: applicationId,
  });

  await sendNotificationMessage(userId, displayTitle, displayMessage);
}

export async function notifyApplicationStatusChange(
  application: Application,
  previousStatus: ApplicationStatus,
  language: Language,
): Promise<void> {
  if (previousStatus === application.status) return;

  const texts = t(language);
  const university = await getUniversityById(application.university_id, language);
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
  const university = await getUniversityById(application.university_id, language);
  const universityName = university?.name ?? application.university_id;
  const statusLabel = getApplicationStatusLabel(language, application.status);

  const title = texts.notificationApplicationSubmittedTitle;
  const message = texts.notificationApplicationSubmittedMessage(universityName, statusLabel);

  await deliverNotification(application.telegram_id, title, message, application.id);
}
