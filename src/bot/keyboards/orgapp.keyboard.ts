import { Markup } from 'telegraf';
import { t } from '../../i18n';
import { Language } from '../../types';
import { ORGANIZATION_TYPES, OrganizationType } from '../../platform/types';
import { WizardStep } from '../../orgapp/types';

/**
 * The whole wizard uses REPLY keyboards, not inline callbacks.
 *
 * Reasons: the audience is an institution's administrator, not a power user, and
 * reply-keyboard buttons behave like the text they represent — so there is no
 * stale-callback failure mode after a bot restart, and a user who types the answer
 * instead of pressing the button is handled by exactly the same code path.
 */
export function wizardKeyboard(language: Language, step: WizardStep) {
  const texts = t(language).orgApp;
  const rows: string[][] = [];

  if (step === 'org_type') {
    const labels = ORGANIZATION_TYPES.map((type) => texts.orgTypeLabels[type]);
    // Two per row: the labels are long enough that three would be truncated.
    for (let i = 0; i < labels.length; i += 2) {
      rows.push(labels.slice(i, i + 2));
    }
  }

  if (step === 'resp_middle_name') {
    rows.push([texts.buttonSkip]);
  }

  if (step === 'confirm') {
    rows.push([texts.buttonSubmit]);
  }

  // The first step has nothing to go back to, so offering "Back" there would be a
  // button that does nothing.
  rows.push(step === 'org_type' ? [texts.buttonCancel] : [texts.buttonBack, texts.buttonCancel]);

  return Markup.keyboard(rows).resize();
}

/** The phone step additionally offers Telegram's own contact-sharing button. */
export function phoneStepKeyboard(language: Language) {
  const texts = t(language).orgApp;
  return Markup.keyboard([
    [Markup.button.contactRequest(texts.buttonSharePhone)],
    [texts.buttonBack, texts.buttonCancel],
  ]).resize();
}

export function keyboardForStep(language: Language, step: WizardStep) {
  return step === 'resp_phone' ? phoneStepKeyboard(language) : wizardKeyboard(language, step);
}

/**
 * Map a pressed/typed label back to an organization type.
 *
 * Every language is searched, not just the current one: a user who switches
 * language mid-wizard still has the old keyboard on screen, and their press should
 * not be read as free text.
 */
export function organizationTypeFromLabel(label: string): OrganizationType | null {
  const needle = label.trim();
  for (const language of ['uz', 'ru', 'en'] as Language[]) {
    const labels = t(language).orgApp.orgTypeLabels;
    for (const type of ORGANIZATION_TYPES) {
      if (labels[type] === needle) return type;
    }
  }
  return null;
}

export type WizardControl = 'back' | 'cancel' | 'skip' | 'submit';

/** Recognise a control button in any language, for the same reason as above. */
export function controlFromLabel(label: string): WizardControl | null {
  const needle = label.trim();
  for (const language of ['uz', 'ru', 'en'] as Language[]) {
    const texts = t(language).orgApp;
    if (needle === texts.buttonBack) return 'back';
    if (needle === texts.buttonCancel) return 'cancel';
    if (needle === texts.buttonSkip) return 'skip';
    if (needle === texts.buttonSubmit) return 'submit';
  }
  return null;
}
