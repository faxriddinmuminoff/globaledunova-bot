import { Language } from '../../types';
import { countUnreadNotifications } from '../../database/repositories/notification.repository';
import { mainMenuKeyboard } from '../keyboards';

export async function mainMenuKeyboardForUser(
  language: Language,
  telegramId: number,
) {
  const unreadCount = await countUnreadNotifications(telegramId);
  return mainMenuKeyboard(language, unreadCount);
}
