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
import {
  ADMIN_ACCEPT_PREFIX,
  ADMIN_DOC_REQ_PREFIX,
  ADMIN_REJECT_PREFIX,
  ADMIN_VIEW_PREFIX,
  ADMIN_DOC_OPEN_PREFIX,
  ADMIN_DOC_VERIFY_PREFIX,
  ADMIN_DOC_REJECT_PREFIX,
  ADMIN_SEARCH_PHONE,
  ADMIN_SEARCH_TGID,
  ADMIN_SEARCH_NAME,
  ADMIN_SEARCH_APP_ID,
  ADMIN_SEARCH_UNI,
  ADMIN_SEARCH_STATUS,
} from '../admin/types';
import {
  handleOrgAppContact,
  handleOrgAppDocument,
  handleOrgAppText,
  isAwaitingCharter,
  isOrgAppActive,
} from './handlers/orgapp.handler';
import { OnboardingStep } from '../types';
import { logger } from '../logger';
import { reportCriticalError } from '../errors/error-reporter';
import {
  handleAdminCommand,
  handleAdminMenuAction,
  handleAdminView,
  handleAdminAccept,
  handleAdminRequestDocuments,
  handleAdminReject,
  handleAdminDocOpen,
  handleAdminDocVerify,
  handleAdminDocReject,
  handleAdminSearchPhone,
  handleAdminSearchTelegramId,
  handleAdminSearchName,
  handleAdminSearchApplicationId,
  handleAdminSearchUniversity,
  handleAdminSearchStatus,
  handleAdminSearchPage,
  handleAdminSearchInput,
  isAdminMode,
  isAdminSearchActive,
} from './handlers/admin.handler';
import {
  handleAdminEnterpriseCallback,
  handleAdminEnterpriseInput,
  isAdminWizardActive,
} from './handlers/admin-enterprise.handler';
import {
  ADMIN_SEARCH_PREV,
  ADMIN_SEARCH_NEXT,
} from '../admin/types';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { commandRateLimitMiddleware } from './middleware/command-rate-limit.middleware';
import { adminThrottleMiddleware } from './middleware/admin-throttle.middleware';
import { isAdmin } from './helpers/admin.helper';
import { getAdminMenuTexts } from './keyboards/admin.keyboard';
import { handleApplicationCallbacks } from './handlers/application.handler';
import {
  APP_VIEW_PREFIX,
  APP_REFRESH_PREFIX,
  APP_UPLOAD_PREFIX,
  APP_CONTACT_PREFIX,
} from './keyboards/application.keyboard';

export function createBot(token: string): Telegraf<AppContext> {
  const bot = new Telegraf<AppContext>(token);

  bot.use(errorMiddleware());
  bot.use(rateLimitMiddleware());
  bot.use(commandRateLimitMiddleware());
  bot.use(adminThrottleMiddleware());
  bot.use(sessionMiddleware());
  bot.use(userMiddleware());

  bot.start(handleStart);

  bot.command('admin', handleAdminCommand);

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

  bot.action(new RegExp(`^${ADMIN_VIEW_PREFIX}`), handleAdminView);
  bot.action(new RegExp(`^${ADMIN_ACCEPT_PREFIX}`), handleAdminAccept);
  bot.action(new RegExp(`^${ADMIN_DOC_REQ_PREFIX}`), handleAdminRequestDocuments);
  bot.action(new RegExp(`^${ADMIN_REJECT_PREFIX}`), handleAdminReject);
  bot.action(new RegExp(`^${ADMIN_DOC_OPEN_PREFIX}`), handleAdminDocOpen);
  bot.action(new RegExp(`^${ADMIN_DOC_VERIFY_PREFIX}`), handleAdminDocVerify);
  bot.action(new RegExp(`^${ADMIN_DOC_REJECT_PREFIX}`), handleAdminDocReject);
  bot.action(ADMIN_SEARCH_PHONE, handleAdminSearchPhone);
  bot.action(ADMIN_SEARCH_TGID, handleAdminSearchTelegramId);
  bot.action(ADMIN_SEARCH_NAME, handleAdminSearchName);
  bot.action(ADMIN_SEARCH_APP_ID, handleAdminSearchApplicationId);
  bot.action(ADMIN_SEARCH_UNI, handleAdminSearchUniversity);
  bot.action(ADMIN_SEARCH_STATUS, handleAdminSearchStatus);
  bot.action(ADMIN_SEARCH_PREV, (ctx) => handleAdminSearchPage(ctx, 'prev'));
  bot.action(ADMIN_SEARCH_NEXT, (ctx) => handleAdminSearchPage(ctx, 'next'));

  bot.action(/^adm:(set|uni|bc|bk|inc|dash):/, handleAdminEnterpriseCallback);

  bot.action(new RegExp(`^${APP_VIEW_PREFIX}`), handleApplicationCallbacks);
  bot.action(new RegExp(`^${APP_REFRESH_PREFIX}`), handleApplicationCallbacks);
  bot.action(new RegExp(`^${APP_UPLOAD_PREFIX}`), handleApplicationCallbacks);
  bot.action(new RegExp(`^${APP_CONTACT_PREFIX}`), handleApplicationCallbacks);

  bot.on('contact', async (ctx) => {
    // The org-application wizard asks for a phone too, so it gets first refusal on
    // a shared contact; otherwise this is onboarding's phone step.
    if (await handleOrgAppContact(ctx)) return;
    await handleContact(ctx);
  });

  bot.on('document', async (ctx) => {
    if (ctx.session.onboardingStep !== OnboardingStep.Complete) return;
    if (await handleOrgAppDocument(ctx)) return;
    if (isAwaitingDocumentUpload(ctx)) {
      await handleDocumentUpload(ctx);
    }
  });

  bot.on('photo', async (ctx) => {
    if (ctx.session.onboardingStep !== OnboardingStep.Complete) return;
    // A charter sent as a photo instead of a file: the wizard answers with the
    // "send it as a file" message rather than letting the update fall through.
    if (isAwaitingCharter(ctx)) {
      await handleOrgAppDocument(ctx);
      return;
    }
    if (isAwaitingDocumentUpload(ctx)) {
      await handleDocumentUpload(ctx);
    }
  });

  bot.on('text', async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text;
    const language = ctx.session?.language ?? 'en';
    const adminMenuTexts = getAdminMenuTexts(language);

    if (
      isAdmin(ctx.from?.id) &&
      (isAdminSearchActive(ctx) || isAdminMode(ctx) || adminMenuTexts.includes(text))
    ) {
      if (!isAdminMode(ctx) && !isAdminSearchActive(ctx)) {
        ctx.session.adminMode = true;
      }

      if (isAdminSearchActive(ctx)) {
        const handled = await handleAdminSearchInput(ctx);
        if (handled) return;
      }

      if (isAdminWizardActive(ctx)) {
        const handled = await handleAdminEnterpriseInput(ctx);
        if (handled) return;
      }

      await handleAdminMenuAction(ctx);
      return;
    }

    if (ctx.session.onboardingStep === OnboardingStep.Phone) {
      await handleInvalidPhoneInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === OnboardingStep.Complete) {
      // Before the menu: an open wizard owns the applicant's text, so an
      // institution name that happens to match a menu label cannot derail it.
      if (isOrgAppActive(ctx)) {
        const handled = await handleOrgAppText(ctx);
        if (handled) return;
      }

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
    void reportCriticalError(error, {
      telegramId: ctx.from?.id,
      handler: `bot.catch:${ctx.updateType}`,
      payload: ctx.update,
    });
  });

  return bot;
}
