import { AppContext, getLanguage } from '../middleware/context.middleware';
import { updateUserLanguage } from '../../database/repositories/user.repository';
import { LANGUAGE_CALLBACK_PREFIX, phoneKeyboard } from '../keyboards';
import { mainMenuKeyboardForUser } from '../helpers/menu.helper';
import { t } from '../../i18n';
import { Language, OnboardingStep } from '../../types';
import { logger } from '../../logger';

const VALID_LANGUAGES: Language[] = ['en', 'ru', 'uz'];

export async function handleLanguageSelection(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const data = ctx.callbackQuery.data;
  if (!data.startsWith(LANGUAGE_CALLBACK_PREFIX)) return;

  const language = data.slice(LANGUAGE_CALLBACK_PREFIX.length) as Language;
  if (!VALID_LANGUAGES.includes(language)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const user = await updateUserLanguage(telegramId, language);
    if (!user) {
      await ctx.answerCbQuery('User not found');
      return;
    }

    ctx.session.user = user;
    ctx.session.language = language;
    ctx.session.onboardingStep = OnboardingStep.Phone;

    const texts = t(language);

    await ctx.answerCbQuery(texts.languageSelected);
    await ctx.editMessageText(texts.languageSelected);
    await ctx.reply(texts.sharePhone, phoneKeyboard(language));
  } catch (error) {
    logger.error({ error, telegramId, language }, 'Language selection failed');
    await ctx.answerCbQuery(t(getLanguage(ctx)).errorGeneric);
    throw error;
  }
}

export async function handleChangeLanguage(ctx: AppContext): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);

  ctx.session.onboardingStep = OnboardingStep.Language;
  await ctx.reply(texts.welcome, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🇬🇧 English', callback_data: `${LANGUAGE_CALLBACK_PREFIX}en` },
          { text: '🇷🇺 Русский', callback_data: `${LANGUAGE_CALLBACK_PREFIX}ru` },
        ],
        [{ text: '🇺🇿 O\'zbekcha', callback_data: `${LANGUAGE_CALLBACK_PREFIX}uz` }],
      ],
    },
  });
}

export async function handleLanguageChangeFromProfile(
  ctx: AppContext,
): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const data = ctx.callbackQuery.data;
  if (!data.startsWith(LANGUAGE_CALLBACK_PREFIX)) return;

  const language = data.slice(LANGUAGE_CALLBACK_PREFIX.length) as Language;
  if (!VALID_LANGUAGES.includes(language)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const user = await updateUserLanguage(telegramId, language);
    if (!user) return;

    ctx.session.user = user;
    ctx.session.language = language;
    ctx.session.onboardingStep = OnboardingStep.Complete;

    const texts = t(language);

    await ctx.answerCbQuery(texts.languageSelected);
    await ctx.editMessageText(texts.languageSelected);

    if (user.phone_number) {
      await ctx.reply(texts.mainMenu, await mainMenuKeyboardForUser(language, telegramId));
    }
  } catch (error) {
    logger.error({ error, telegramId }, 'Profile language change failed');
    throw error;
  }
}
