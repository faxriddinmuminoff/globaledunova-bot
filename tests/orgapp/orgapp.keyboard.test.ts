import { describe, it, expect } from 'vitest';
import {
  controlFromLabel,
  keyboardForStep,
  organizationTypeFromLabel,
  wizardKeyboard,
} from '../../src/bot/keyboards/orgapp.keyboard';
import { t } from '../../src/i18n';
import { Language } from '../../src/types';
import { ORGANIZATION_TYPES } from '../../src/platform/types';
import { WIZARD_STEPS } from '../../src/orgapp/types';

const LANGUAGES: Language[] = ['uz', 'ru', 'en'];

type ReplyButton = string | { text: string; request_contact?: boolean };

function rows(markup: ReturnType<typeof wizardKeyboard>): string[][] {
  // Telegraf keeps plain buttons as bare strings and only wraps the special ones
  // (contact request) into objects, so both shapes have to be read.
  const keyboard = (markup.reply_markup as { keyboard: ReplyButton[][] }).keyboard;
  return keyboard.map((row) =>
    row.map((button) => (typeof button === 'string' ? button : button.text)),
  );
}

describe('organizationTypeFromLabel', () => {
  it.each(LANGUAGES)('round-trips every type label in %s', (language) => {
    const labels = t(language).orgApp.orgTypeLabels;
    for (const type of ORGANIZATION_TYPES) {
      expect(organizationTypeFromLabel(labels[type])).toBe(type);
    }
  });

  it('recognises a label from another language, so a stale keyboard still works', () => {
    expect(organizationTypeFromLabel(t('ru').orgApp.orgTypeLabels.college)).toBe('college');
    expect(organizationTypeFromLabel(t('en').orgApp.orgTypeLabels.college)).toBe('college');
  });

  it('tolerates surrounding whitespace', () => {
    expect(organizationTypeFromLabel(`  ${t('uz').orgApp.orgTypeLabels.institute}  `)).toBe(
      'institute',
    );
  });

  it('returns null for free text', () => {
    expect(organizationTypeFromLabel('Toshkent moliya instituti')).toBeNull();
    expect(organizationTypeFromLabel('')).toBeNull();
  });
});

describe('controlFromLabel', () => {
  it.each(LANGUAGES)('recognises every control in %s', (language) => {
    const texts = t(language).orgApp;
    expect(controlFromLabel(texts.buttonBack)).toBe('back');
    expect(controlFromLabel(texts.buttonCancel)).toBe('cancel');
    expect(controlFromLabel(texts.buttonSkip)).toBe('skip');
    expect(controlFromLabel(texts.buttonSubmit)).toBe('submit');
  });

  it('returns null for an ordinary answer', () => {
    expect(controlFromLabel('305447892')).toBeNull();
  });

  it('does not mistake an organization type label for a control', () => {
    for (const type of ORGANIZATION_TYPES) {
      expect(controlFromLabel(t('uz').orgApp.orgTypeLabels[type])).toBeNull();
    }
  });
});

describe('wizardKeyboard', () => {
  it('offers cancel but not back on the first step', () => {
    const layout = rows(wizardKeyboard('uz', 'org_type'));
    const last = layout[layout.length - 1];
    expect(last).toEqual([t('uz').orgApp.buttonCancel]);
    expect(layout.flat()).not.toContain(t('uz').orgApp.buttonBack);
  });

  it('lists all six organization types on the first step', () => {
    const flat = rows(wizardKeyboard('uz', 'org_type')).flat();
    for (const type of ORGANIZATION_TYPES) {
      expect(flat).toContain(t('uz').orgApp.orgTypeLabels[type]);
    }
  });

  it('offers back and cancel on every later step', () => {
    for (const step of WIZARD_STEPS.filter((s) => s !== 'org_type')) {
      const flat = rows(wizardKeyboard('uz', step)).flat();
      expect(flat).toContain(t('uz').orgApp.buttonBack);
      expect(flat).toContain(t('uz').orgApp.buttonCancel);
    }
  });

  it('offers skip only on the sharif step', () => {
    for (const step of WIZARD_STEPS) {
      const flat = rows(wizardKeyboard('uz', step)).flat();
      expect(flat.includes(t('uz').orgApp.buttonSkip)).toBe(step === 'resp_middle_name');
    }
  });

  it('offers submit only on the confirm step', () => {
    for (const step of WIZARD_STEPS) {
      const flat = rows(wizardKeyboard('uz', step)).flat();
      expect(flat.includes(t('uz').orgApp.buttonSubmit)).toBe(step === 'confirm');
    }
  });

  it('uses the contact-request button on the phone step', () => {
    const markup = keyboardForStep('uz', 'resp_phone');
    const keyboard = (
      markup.reply_markup as { keyboard: { text: string; request_contact?: boolean }[][] }
    ).keyboard;
    expect(keyboard[0][0].request_contact).toBe(true);
  });

  it('does not request a contact on any other step', () => {
    for (const step of WIZARD_STEPS.filter((s) => s !== 'resp_phone')) {
      const keyboard = (
        keyboardForStep('uz', step).reply_markup as {
          keyboard: { request_contact?: boolean }[][];
        }
      ).keyboard;
      expect(keyboard.flat().some((button) => button.request_contact)).toBe(false);
    }
  });
});
