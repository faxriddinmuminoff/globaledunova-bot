import { AppContext } from '../middleware/context.middleware';
import {
  getOrCreateUser,
  isUserOnboarded,
} from '../../database/repositories/user.repository';
import { languageKeyboard, phoneKeyboard } from '../keyboards';
import { mainMenuKeyboardForUser } from '../helpers/menu.helper';
import { t } from '../../i18n';
import { OnboardingStep } from '../../types';
import { logger } from '../../logger';
import { isStudentWhitelisted } from '../../services/soft-launch.service';

export async function handleStart(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const fullName = [ctx.from?.first_name, ctx.from?.last_name]
      .filter(Boolean)
      .join(' ');

    const user = await getOrCreateUser(telegramId, fullName || undefined);
    ctx.session.user = user;
    ctx.session.language = user.language;

    const onboarded = await isUserOnboarded(telegramId);

    if (onboarded) {
      if (!(await isStudentWhitelisted(telegramId))) {
        const texts = t(user.language);
        await ctx.reply(texts.softLaunchBlocked);
        return;
      }

      ctx.session.onboardingStep = OnboardingStep.Complete;
      const texts = t(user.language);
      await ctx.reply(texts.mainMenu, await mainMenuKeyboardForUser(user.language, telegramId));
      return;
    }

    if (user.language && user.language !== 'en') {
      ctx.session.onboardingStep = OnboardingStep.Phone;
      const texts = t(user.language);
      await ctx.reply(texts.sharePhone, phoneKeyboard(user.language));
      return;
    }

    ctx.session.onboardingStep = OnboardingStep.Language;
    await ctx.reply(t('en').welcome, languageKeyboard());
  } catch (error) {
    logger.error({ error, telegramId }, 'Start command failed');
    throw error;
  }
}
