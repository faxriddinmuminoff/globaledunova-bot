import { Markup } from 'telegraf';
import { Language } from '../../types';
import { t } from '../../i18n';

const LANGUAGE_CALLBACK_PREFIX = 'lang:';

export function languageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🇬🇧 English', `${LANGUAGE_CALLBACK_PREFIX}en`),
      Markup.button.callback('🇷🇺 Русский', `${LANGUAGE_CALLBACK_PREFIX}ru`),
    ],
    [Markup.button.callback('🇺🇿 O\'zbekcha', `${LANGUAGE_CALLBACK_PREFIX}uz`)],
  ]);
}

export function phoneKeyboard(language: Language) {
  const texts = t(language);
  return Markup.keyboard([[Markup.button.contactRequest(texts.sharePhoneButton)]])
    .oneTime()
    .resize();
}

export function mainMenuKeyboard(language: Language, unreadCount = 0) {
  const texts = t(language);
  const notificationsLabel =
    unreadCount > 0 ? texts.notificationsWithCount(unreadCount) : texts.notifications;

  return Markup.keyboard([
    // Faza 0 — the institution application flow, first because it is what this bot
    // is now for. The rows below belong to the study-abroad domain and are removed
    // in the clean-up step.
    [texts.orgApp.menuApply],
    [texts.orgApp.menuMyApplications, notificationsLabel],
    [texts.contactManager, texts.profile],
  ]).resize();
}

export function backToMenuKeyboard(language: Language) {
  const texts = t(language);
  return Markup.keyboard([[texts.backToMenu]]).resize();
}

export function profileKeyboard(language: Language) {
  const texts = t(language);
  return Markup.keyboard([[texts.changeLanguage], [texts.backToMenu]]).resize();
}

export { LANGUAGE_CALLBACK_PREFIX };
