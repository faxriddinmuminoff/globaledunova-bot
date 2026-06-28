import { Markup } from 'telegraf';
import { Language } from '../../types';
import { t } from '../../i18n';
import { Notification } from '../../notifications/types';
import {
  NOTIF_CLEAR_ALL,
  NOTIF_READ_ALL,
  NOTIF_READ_PREFIX,
} from '../../notifications/types';

export function notificationsKeyboard(language: Language, notifications: Notification[]) {
  const texts = t(language);
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];

  const unread = notifications.filter((n) => !n.is_read);
  for (const notification of unread.slice(0, 5)) {
    rows.push([
      Markup.button.callback(
        `✓ ${notification.title.slice(0, 40)}`,
        `${NOTIF_READ_PREFIX}${notification.id}`,
      ),
    ]);
  }

  if (unread.length > 0) {
    rows.push([Markup.button.callback(texts.markAllNotificationsRead, NOTIF_READ_ALL)]);
  }

  if (notifications.length > 0) {
    rows.push([Markup.button.callback(texts.clearAllNotifications, NOTIF_CLEAR_ALL)]);
  }

  return Markup.inlineKeyboard(rows);
}

export function parseNotificationReadCallback(data: string): number | null {
  if (!data.startsWith(NOTIF_READ_PREFIX)) return null;
  const id = Number(data.slice(NOTIF_READ_PREFIX.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}
