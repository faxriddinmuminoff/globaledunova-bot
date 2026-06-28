import { Telegraf } from 'telegraf';
import { AppContext, sessionMiddleware, userMiddleware } from './middleware/context.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { handleStart } from './handlers/start.handler';
import {
  handleLanguageSelection,
  handleLanguageChangeFromProfile,
} from './handlers/language.handler';
import { handleContact, handleInvalidPhoneInput } from './handlers/phone.handler';
import { handleMenuAction } from './handlers/menu.handler';
import {
  handleBackToCountries,
  handleBackToDegrees,
  handleCountrySelection,
  handleDegreeSelection,
  handleUniversityApply,
} from './handlers/universities.handler';
import {
  handleApplicationSelection,
  handleDocumentCancel,
  handleDocumentTypeSelection,
  handleDocumentUpload,
  handleDocumentUploadText,
  isAwaitingDocumentUpload,
} from './handlers/documents.handler';
import {
  handleClearAllNotifications,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
} from './handlers/notifications.handler';
import { LANGUAGE_CALLBACK_PREFIX } from './keyboards';
import {
  NOTIF_CLEAR_ALL,
  NOTIF_READ_ALL,
  NOTIF_READ_PREFIX,
} from '../notifications/types';
import {
  UNI_APPLY_PREFIX,
  UNI_BACK_COUNTRIES,
  UNI_BACK_DEGREES_PREFIX,
  UNI_COUNTRY_PREFIX,
  UNI_DEGREE_PREFIX,
} from '../universities/types';
import {
  DOC_APP_PREFIX,
  DOC_CANCEL,
  DOC_TYPE_PREFIX,
} from '../documents/types';
import { OnboardingStep } from '../types';
import { logger } from '../logger';

export function createBot(token: string): Telegraf<AppContext> {
  const bot = new Telegraf<AppContext>(token);

  bot.use(errorMiddleware());
  bot.use(sessionMiddleware());
  bot.use(userMiddleware());

  bot.start(handleStart);

  bot.action(new RegExp(`^${LANGUAGE_CALLBACK_PREFIX}`), async (ctx) => {
    if (ctx.session.onboardingStep === OnboardingStep.Complete) {
      await handleLanguageChangeFromProfile(ctx);
    } else {
      await handleLanguageSelection(ctx);
    }
  });

  bot.action(new RegExp(`^${UNI_COUNTRY_PREFIX}`), handleCountrySelection);
  bot.action(new RegExp(`^${UNI_DEGREE_PREFIX}`), handleDegreeSelection);
  bot.action(new RegExp(`^${UNI_APPLY_PREFIX}`), handleUniversityApply);
  bot.action(UNI_BACK_COUNTRIES, handleBackToCountries);
  bot.action(new RegExp(`^${UNI_BACK_DEGREES_PREFIX}`), handleBackToDegrees);

  bot.action(new RegExp(`^${DOC_APP_PREFIX}`), handleApplicationSelection);
  bot.action(new RegExp(`^${DOC_TYPE_PREFIX}`), handleDocumentTypeSelection);
  bot.action(DOC_CANCEL, handleDocumentCancel);

  bot.action(NOTIF_READ_ALL, handleMarkAllNotificationsRead);
  bot.action(NOTIF_CLEAR_ALL, handleClearAllNotifications);
  bot.action(new RegExp(`^${NOTIF_READ_PREFIX}`), handleMarkNotificationRead);

  bot.on('contact', handleContact);

  bot.on('document', async (ctx) => {
    if (
      ctx.session.onboardingStep === OnboardingStep.Complete &&
      isAwaitingDocumentUpload(ctx)
    ) {
      await handleDocumentUpload(ctx);
    }
  });

  bot.on('photo', async (ctx) => {
    if (
      ctx.session.onboardingStep === OnboardingStep.Complete &&
      isAwaitingDocumentUpload(ctx)
    ) {
      await handleDocumentUpload(ctx);
    }
  });

  bot.on('text', async (ctx) => {
    if (ctx.session.onboardingStep === OnboardingStep.Phone) {
      await handleInvalidPhoneInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === OnboardingStep.Complete) {
      if (isAwaitingDocumentUpload(ctx)) {
        const handled = await handleDocumentUploadText(ctx);
        if (handled) return;
      }

      await handleMenuAction(ctx);
    }
  });

  bot.catch((error, ctx) => {
    logger.error(
      {
        error,
        updateType: ctx.updateType,
        userId: ctx.from?.id,
      },
      'Bot catch handler',
    );
  });

  return bot;
}
