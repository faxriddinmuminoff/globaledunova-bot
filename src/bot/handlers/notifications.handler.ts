import { AppContext, getLanguage } from '../middleware/context.middleware';
import { t } from '../../i18n';
import { Language } from '../../types';
import {
  clearAllNotifications,
  countUnreadNotifications,
  findNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../database/repositories/notification.repository';
import {
  notificationsKeyboard,
  parseNotificationReadCallback,
} from '../keyboards/notifications.keyboard';
import { NOTIF_CLEAR_ALL, NOTIF_READ_ALL } from '../../notifications/types';
import { logger } from '../../logger';

function formatDate(date: Date, language: Language): string {
  const localeMap = { en: 'en-GB', ru: 'ru-RU', uz: 'uz-UZ' } as const;
  return date.toLocaleDateString(localeMap[language], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNotificationEntry(
  language: Language,
  notification: Awaited<ReturnType<typeof findNotificationsByUserId>>[number],
  index: number,
): string {
  const texts = t(language);
  const readLabel = notification.is_read
    ? texts.notificationRead
    : texts.notificationUnread;

  return texts.notificationEntry(
    index + 1,
    notification.title,
    notification.message,
    formatDate(notification.created_at, language),
    readLabel,
  );
}

export async function getNotificationsMenuLabel(language: Language): Promise<string> {
  const texts = t(language);
  return texts.notifications;
}

export async function getNotificationsMenuLabelWithCount(
  language: Language,
  userId: number,
): Promise<string> {
  const texts = t(language);
  const unread = await countUnreadNotifications(userId);
  return unread > 0 ? texts.notificationsWithCount(unread) : texts.notifications;
}

export async function showNotifications(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  const notifications = await findNotificationsByUserId(telegramId);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (notifications.length === 0) {
    await ctx.reply(texts.noNotificationsYet, { parse_mode: 'Markdown' });
    return;
  }

  const header =
    unreadCount > 0
      ? texts.notificationsListTitleWithUnread(unreadCount)
      : texts.notificationsListTitle;

  const entries = notifications
    .map((notification, index) => formatNotificationEntry(language, notification, index))
    .join('\n\n');

  await ctx.reply(`${header}\n\n${entries}`, {
    parse_mode: 'Markdown',
    ...notificationsKeyboard(language, notifications),
  });
}

export async function handleMarkNotificationRead(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const notificationId = parseNotificationReadCallback(ctx.callbackQuery.data);
  if (!notificationId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  try {
    const updated = await markNotificationAsRead(notificationId, telegramId);
    if (!updated) {
      await ctx.answerCbQuery(texts.notificationNotFound, { show_alert: true });
      return;
    }

    await ctx.answerCbQuery(texts.notificationMarkedRead);
    await refreshNotificationsView(ctx);
  } catch (error) {
    logger.error({ error, telegramId, notificationId }, 'Failed to mark notification as read');
    await ctx.answerCbQuery(texts.errorGeneric, { show_alert: true });
    throw error;
  }
}

export async function handleMarkAllNotificationsRead(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (ctx.callbackQuery.data !== NOTIF_READ_ALL) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  try {
    const count = await markAllNotificationsAsRead(telegramId);
    await ctx.answerCbQuery(
      count > 0 ? texts.allNotificationsMarkedRead(count) : texts.noUnreadNotifications,
    );
    await refreshNotificationsView(ctx);
  } catch (error) {
    logger.error({ error, telegramId }, 'Failed to mark all notifications as read');
    await ctx.answerCbQuery(texts.errorGeneric, { show_alert: true });
    throw error;
  }
}

export async function handleClearAllNotifications(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (ctx.callbackQuery.data !== NOTIF_CLEAR_ALL) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  try {
    const count = await clearAllNotifications(telegramId);
    await ctx.answerCbQuery(
      count > 0 ? texts.notificationsCleared(count) : texts.noNotificationsYet,
    );

    if (ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
      await ctx.editMessageText(texts.noNotificationsYet, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    logger.error({ error, telegramId }, 'Failed to clear notifications');
    await ctx.answerCbQuery(texts.errorGeneric, { show_alert: true });
    throw error;
  }
}

async function refreshNotificationsView(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);
  const notifications = await findNotificationsByUserId(telegramId);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (notifications.length === 0) {
    if (ctx.callbackQuery?.message && 'text' in ctx.callbackQuery.message) {
      await ctx.editMessageText(texts.noNotificationsYet, { parse_mode: 'Markdown' });
    }
    return;
  }

  const header =
    unreadCount > 0
      ? texts.notificationsListTitleWithUnread(unreadCount)
      : texts.notificationsListTitle;

  const entries = notifications
    .map((notification, index) => formatNotificationEntry(language, notification, index))
    .join('\n\n');

  if (ctx.callbackQuery?.message && 'text' in ctx.callbackQuery.message) {
    await ctx.editMessageText(`${header}\n\n${entries}`, {
      parse_mode: 'Markdown',
      ...notificationsKeyboard(language, notifications),
    });
  }
}
