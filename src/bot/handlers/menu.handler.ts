import { AppContext, getLanguage, getUser } from '../middleware/context.middleware';
import { profileKeyboard } from '../keyboards';
import { mainMenuKeyboardForUser } from '../helpers/menu.helper';
import { t, getLanguageLabel } from '../../i18n';
import { config } from '../../config';
import { OnboardingStep, Translations } from '../../types';
import { handleChangeLanguage } from './language.handler';
import { startUniversitiesFlow } from './universities.handler';
import { showMyApplicationsWithDetails } from './application.handler';
import {
  startDocumentsFlow,
  showMyDocuments,
  clearDocumentFlow,
} from './documents.handler';
import { showNotifications } from './notifications.handler';
import { showMyOrgApplications, startOrgApplication } from './orgapp.handler';

function isNotificationsMenuText(text: string, texts: Translations): boolean {
  return text === texts.notifications || (text.startsWith('📬') && /\(\d+\)$/.test(text));
}

function getMenuTexts(language: Translations): string[] {
  return [
    language.orgApp.menuApply,
    language.orgApp.menuMyApplications,
    language.universities,
    language.myApplications,
    language.documents,
    language.myDocuments,
    language.contactManager,
    language.profile,
    language.backToMenu,
    language.changeLanguage,
  ];
}

export async function handleMenuAction(ctx: AppContext): Promise<void> {
  if (!ctx.message || !('text' in ctx.message)) return;
  if (ctx.session.onboardingStep !== OnboardingStep.Complete) return;

  const text = ctx.message.text;
  const language = getLanguage(ctx);
  const texts = t(language);
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  if (isNotificationsMenuText(text, texts)) {
    await showNotifications(ctx);
    return;
  }

  const menuTexts = getMenuTexts(texts);
  if (!menuTexts.includes(text)) return;

  if (text === texts.orgApp.menuApply) {
    await startOrgApplication(ctx);
    return;
  }

  if (text === texts.orgApp.menuMyApplications) {
    await showMyOrgApplications(ctx);
    return;
  }

  if (text === texts.universities) {
    await startUniversitiesFlow(ctx);
    return;
  }

  if (text === texts.myApplications) {
    await showMyApplicationsWithDetails(ctx);
    return;
  }

  if (text === texts.documents) {
    await startDocumentsFlow(ctx);
    return;
  }

  if (text === texts.myDocuments) {
    await showMyDocuments(ctx);
    return;
  }

  if (text === texts.contactManager) {
    await ctx.reply(texts.contactManagerText(config.MANAGER_USERNAME), {
      parse_mode: 'Markdown',
    });
    return;
  }

  if (text === texts.profile) {
    const user = getUser(ctx);
    const name = user?.full_name ?? ctx.from?.first_name ?? '—';
    const phone = user?.phone_number ?? '—';
    const langLabel = getLanguageLabel(language);

    await ctx.reply(texts.profileText(name, phone, langLabel), {
      parse_mode: 'Markdown',
      ...profileKeyboard(language),
    });
    return;
  }

  if (text === texts.backToMenu) {
    clearDocumentFlow(ctx);
    await ctx.reply(texts.mainMenu, await mainMenuKeyboardForUser(language, telegramId));
    return;
  }

  if (text === texts.changeLanguage) {
    await handleChangeLanguage(ctx);
  }
}
