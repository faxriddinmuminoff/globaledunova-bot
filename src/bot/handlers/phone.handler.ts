import { Markup } from 'telegraf';
import { AppContext, getLanguage } from '../middleware/context.middleware';
import { updateUserPhone } from '../../database/repositories/user.repository';
import { mainMenuKeyboardForUser } from '../helpers/menu.helper';
import { t } from '../../i18n';
import { OnboardingStep } from '../../types';
import { logger } from '../../logger';

export async function handleContact(ctx: AppContext): Promise<void> {
  const contact = ctx.message && 'contact' in ctx.message ? ctx.message.contact : null;
  const telegramId = ctx.from?.id;

  if (!contact || !telegramId) return;

  if (contact.user_id !== telegramId) {
    const texts = t(getLanguage(ctx));
    await ctx.reply(texts.invalidPhone);
    return;
  }

  try {
    const fullName = [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(' ');

    const user = await updateUserPhone(
      telegramId,
      contact.phone_number,
      fullName || undefined,
    );

    if (!user) {
      throw new Error('Failed to update user phone');
    }

    ctx.session.user = user;
    ctx.session.language = user.language;
    ctx.session.onboardingStep = OnboardingStep.Complete;

    const texts = t(user.language);
    await ctx.reply(texts.phoneReceived, Markup.removeKeyboard());
    await ctx.reply(texts.mainMenu, await mainMenuKeyboardForUser(user.language, telegramId));
  } catch (error) {
    logger.error({ error, telegramId }, 'Phone sharing failed');
    throw error;
  }
}

export async function handleInvalidPhoneInput(ctx: AppContext): Promise<void> {
  if (ctx.session.onboardingStep !== OnboardingStep.Phone) return;

  const texts = t(getLanguage(ctx));
  await ctx.reply(texts.invalidPhone);
}
