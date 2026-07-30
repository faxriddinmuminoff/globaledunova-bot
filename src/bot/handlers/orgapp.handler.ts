import { AppContext, getLanguage } from '../middleware/context.middleware';
import { t } from '../../i18n';
import { logger } from '../../logger';
import { Language, OnboardingStep } from '../../types';
import { mainMenuKeyboardForUser } from '../helpers/menu.helper';
import {
  controlFromLabel,
  keyboardForStep,
  organizationTypeFromLabel,
} from '../keyboards/orgapp.keyboard';
import {
  applicationsListText,
  fieldErrorText,
  promptForStep,
} from '../../orgapp/prompts';
import {
  createWizard,
  isSubmittable,
  nextStep,
  previousStep,
  validateNamePart,
  validateOrganizationName,
  validatePhone,
  validateStir,
} from '../../orgapp/wizard';
import { WizardState, WizardStep } from '../../orgapp/types';
import { defaultFetchBytes, storeCharter } from '../../orgapp/charter-storage';
import { listApplicationsFor, submitApplication } from '../../orgapp/orgapp.service';

const MARKDOWN = { parse_mode: 'Markdown' as const };

export function isOrgAppActive(ctx: AppContext): boolean {
  return ctx.session.orgAppWizard !== null;
}

export function clearOrgAppWizard(ctx: AppContext): void {
  ctx.session.orgAppWizard = null;
}

/** True while the wizard is waiting for a file rather than text. */
export function isAwaitingCharter(ctx: AppContext): boolean {
  return ctx.session.orgAppWizard?.step === 'charter';
}

export async function startOrgApplication(ctx: AppContext): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language).orgApp;

  if (ctx.session.orgAppWizard) {
    const wizard = ctx.session.orgAppWizard;
    await ctx.reply(texts.alreadyInProgress);
    await sendStep(ctx, language, wizard);
    return;
  }

  const wizard = createWizard();
  ctx.session.orgAppWizard = wizard;

  await ctx.reply(texts.intro, MARKDOWN);
  await sendStep(ctx, language, wizard);
}

export async function showMyOrgApplications(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const records = await listApplicationsFor(telegramId);
  await ctx.reply(applicationsListText(language, records), MARKDOWN);
}

/**
 * Text router for the wizard.
 *
 * Returns true when the message was consumed, so the generic menu handler does not
 * also act on it. Control buttons are checked before field input, because a user
 * pressing "Back" must never have that label stored as an institution name.
 */
export async function handleOrgAppText(ctx: AppContext): Promise<boolean> {
  const wizard = ctx.session.orgAppWizard;
  if (!wizard) return false;
  if (!ctx.message || !('text' in ctx.message)) return false;

  const language = getLanguage(ctx);
  const texts = t(language).orgApp;
  const raw = ctx.message.text;

  const control = controlFromLabel(raw);

  if (control === 'cancel') {
    clearOrgAppWizard(ctx);
    await ctx.reply(texts.cancelled, await mainMenuKeyboard(ctx, language));
    return true;
  }

  if (control === 'back') {
    wizard.step = previousStep(wizard.step);
    await sendStep(ctx, language, wizard);
    return true;
  }

  if (control === 'skip') {
    if (wizard.step === 'resp_middle_name') {
      wizard.draft.middleName = '';
      await advance(ctx, language, wizard);
    } else {
      // A stale Skip button from an earlier step — say what is expected instead of
      // silently ignoring the press.
      await sendStep(ctx, language, wizard);
    }
    return true;
  }

  if (control === 'submit') {
    if (wizard.step === 'confirm') {
      await submit(ctx, language, wizard);
    } else {
      await sendStep(ctx, language, wizard);
    }
    return true;
  }

  return applyTextAnswer(ctx, language, wizard, raw);
}

/** Contact sharing, which only makes sense on the phone step. */
export async function handleOrgAppContact(ctx: AppContext): Promise<boolean> {
  const wizard = ctx.session.orgAppWizard;
  if (!wizard || wizard.step !== 'resp_phone') return false;
  if (!ctx.message || !('contact' in ctx.message) || !ctx.message.contact) return false;

  const language = getLanguage(ctx);
  const result = validatePhone(ctx.message.contact.phone_number);

  if (!result.ok || !result.value) {
    await ctx.reply(fieldErrorText(language, result.error ?? 'phone_format'), MARKDOWN);
    return true;
  }

  wizard.draft.phone = result.value;
  await advance(ctx, language, wizard);
  return true;
}

export async function handleOrgAppDocument(ctx: AppContext): Promise<boolean> {
  const wizard = ctx.session.orgAppWizard;
  if (!wizard) return false;

  const language = getLanguage(ctx);
  const texts = t(language).orgApp;

  if (wizard.step !== 'charter') {
    // A file arriving at any other step is a misunderstanding, not an error state.
    await ctx.reply(texts.errorPickFromButtons);
    await sendStep(ctx, language, wizard);
    return true;
  }

  if (!ctx.message || !('document' in ctx.message) || !ctx.message.document) {
    // A photo (not a document) lands here too: tell them to send it as a file.
    await ctx.reply(texts.errorFileType, MARKDOWN);
    return true;
  }

  const document = ctx.message.document;
  const result = await storeCharter(
    {
      telegramFileId: document.file_id,
      fileName: document.file_name ?? 'charter',
      mimeType: document.mime_type ?? 'application/octet-stream',
      sizeBytes: document.file_size ?? 0,
    },
    {
      getFileLink: async (fileId) => (await ctx.telegram.getFileLink(fileId)).toString(),
      fetchBytes: defaultFetchBytes,
    },
  );

  if (!result.ok || !result.value) {
    await ctx.reply(fieldErrorText(language, result.error ?? 'required'), MARKDOWN);
    return true;
  }

  wizard.draft.charter = result.value;
  await advance(ctx, language, wizard);
  return true;
}

// ---------------------------------------------------------------------------

async function applyTextAnswer(
  ctx: AppContext,
  language: Language,
  wizard: WizardState,
  raw: string,
): Promise<boolean> {
  const texts = t(language).orgApp;

  switch (wizard.step) {
    case 'org_type': {
      const type = organizationTypeFromLabel(raw);
      if (!type) {
        await ctx.reply(texts.errorPickFromButtons);
        return true;
      }
      wizard.draft.organizationType = type;
      break;
    }
    case 'org_name': {
      const result = validateOrganizationName(raw);
      if (!result.ok) return replyFieldError(ctx, language, result.error);
      wizard.draft.organizationName = result.value;
      break;
    }
    case 'stir': {
      const result = validateStir(raw);
      if (!result.ok) return replyFieldError(ctx, language, result.error);
      wizard.draft.stir = result.value;
      break;
    }
    case 'resp_last_name': {
      const result = validateNamePart(raw, true);
      if (!result.ok) return replyFieldError(ctx, language, result.error);
      wizard.draft.lastName = result.value;
      break;
    }
    case 'resp_first_name': {
      const result = validateNamePart(raw, true);
      if (!result.ok) return replyFieldError(ctx, language, result.error);
      wizard.draft.firstName = result.value;
      break;
    }
    case 'resp_middle_name': {
      const result = validateNamePart(raw, false);
      if (!result.ok) return replyFieldError(ctx, language, result.error);
      wizard.draft.middleName = result.value;
      break;
    }
    case 'resp_phone': {
      const result = validatePhone(raw);
      if (!result.ok) return replyFieldError(ctx, language, result.error);
      wizard.draft.phone = result.value;
      break;
    }
    case 'charter':
      await ctx.reply(texts.errorExpectDocument, MARKDOWN);
      return true;
    case 'confirm':
      // Any other text on the confirm screen: re-show it rather than guess.
      await sendStep(ctx, language, wizard);
      return true;
    default:
      return false;
  }

  await advance(ctx, language, wizard);
  return true;
}

async function replyFieldError(
  ctx: AppContext,
  language: Language,
  error: Parameters<typeof fieldErrorText>[1] | undefined,
): Promise<boolean> {
  await ctx.reply(fieldErrorText(language, error ?? 'required'), MARKDOWN);
  return true;
}

async function advance(
  ctx: AppContext,
  language: Language,
  wizard: WizardState,
): Promise<void> {
  wizard.step = nextStep(wizard.step);
  await sendStep(ctx, language, wizard);
}

async function sendStep(
  ctx: AppContext,
  language: Language,
  wizard: WizardState,
): Promise<void> {
  await ctx.reply(promptForStep(language, wizard.step, wizard.draft), {
    ...MARKDOWN,
    ...keyboardForStep(language, wizard.step),
  });
}

async function submit(
  ctx: AppContext,
  language: Language,
  wizard: WizardState,
): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const texts = t(language).orgApp;

  if (!isSubmittable(wizard.draft)) {
    // Should be unreachable — confirm is the last step — but guessing which field
    // is missing is worse than asking the applicant to walk back through it.
    await ctx.reply(texts.submitFailedValidation, MARKDOWN);
    await sendStep(ctx, language, wizard);
    return;
  }

  await ctx.reply(texts.submitting);

  const outcome = await submitApplication({
    telegramId,
    idempotencyKey: wizard.idempotencyKey,
    draft: wizard.draft,
  });

  if (outcome.ok) {
    clearOrgAppWizard(ctx);
    await ctx.reply(texts.submitted(outcome.record.applicationId), {
      ...MARKDOWN,
      ...(await mainMenuKeyboard(ctx, language)),
    });
    return;
  }

  logger.warn({ telegramId, reason: outcome.reason }, 'Organization application not accepted');

  const message =
    outcome.reason === 'stir_taken'
      ? texts.submitFailedStirTaken
      : outcome.reason === 'unavailable'
        ? texts.submitFailedUnavailable
        : texts.submitFailedValidation;

  await ctx.reply(message, MARKDOWN);

  // The wizard is deliberately KEPT open on failure: the applicant has typed eight
  // answers and uploaded a document, and the idempotency key is unchanged, so
  // pressing submit again after an outage is safe and costs them nothing.
  await sendStep(ctx, language, wizard);
}

async function mainMenuKeyboard(ctx: AppContext, language: Language) {
  const telegramId = ctx.from?.id;
  ctx.session.onboardingStep = OnboardingStep.Complete;
  return telegramId ? mainMenuKeyboardForUser(language, telegramId) : undefined;
}

export type { WizardStep };
