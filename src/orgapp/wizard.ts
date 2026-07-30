import { randomUUID } from 'node:crypto';
import { isOrganizationType, isValidStir, OrganizationType } from '../platform/types';
import {
  ALLOWED_CHARTER_EXTENSIONS,
  MAX_CHARTER_SIZE_BYTES,
  MAX_NAME_PART_LENGTH,
  MAX_ORGANIZATION_NAME_LENGTH,
  StepResult,
  WIZARD_STEPS,
  WizardDraft,
  WizardState,
  WizardStep,
} from './types';

export function createWizard(): WizardState {
  return {
    step: 'org_type',
    draft: {},
    idempotencyKey: randomUUID(),
    startedAt: Date.now(),
  };
}

export function nextStep(step: WizardStep): WizardStep {
  const index = WIZARD_STEPS.indexOf(step);
  // The last step (confirm) has no successor — staying there is correct, because
  // leaving it is a submit, not a navigation.
  if (index < 0 || index === WIZARD_STEPS.length - 1) return step;
  return WIZARD_STEPS[index + 1];
}

export function previousStep(step: WizardStep): WizardStep {
  const index = WIZARD_STEPS.indexOf(step);
  if (index <= 0) return WIZARD_STEPS[0];
  return WIZARD_STEPS[index - 1];
}

export function isFirstStep(step: WizardStep): boolean {
  return step === WIZARD_STEPS[0];
}

/** 1-based position, for a "3 / 9" progress hint. */
export function stepPosition(step: WizardStep): { current: number; total: number } {
  return { current: WIZARD_STEPS.indexOf(step) + 1, total: WIZARD_STEPS.length };
}

// ---------------------------------------------------------------------------
// Field validation — pure, so it can be tested exhaustively without Telegram
// ---------------------------------------------------------------------------

export function validateOrganizationType(raw: string): StepResult<OrganizationType> {
  const value = raw.trim();
  if (!value) return { ok: false, error: 'required' };
  if (!isOrganizationType(value)) return { ok: false, error: 'required' };
  return { ok: true, value };
}

export function validateOrganizationName(raw: string): StepResult<string> {
  const value = collapseWhitespace(raw);
  if (!value) return { ok: false, error: 'required' };
  if (value.length > MAX_ORGANIZATION_NAME_LENGTH) return { ok: false, error: 'too_long' };
  return { ok: true, value };
}

export function validateStir(raw: string): StepResult<string> {
  // People paste STIR with spaces or dashes from a document; strip those before
  // judging the value, then store the digits only.
  const value = raw.replace(/[\s-]/g, '');
  if (!value) return { ok: false, error: 'required' };
  if (!isValidStir(value)) return { ok: false, error: 'stir_format' };
  return { ok: true, value };
}

export function validateNamePart(raw: string, required: boolean): StepResult<string> {
  const value = collapseWhitespace(raw);
  if (!value) {
    return required ? { ok: false, error: 'required' } : { ok: true, value: '' };
  }
  if (value.length > MAX_NAME_PART_LENGTH) return { ok: false, error: 'too_long' };
  return { ok: true, value };
}

/**
 * Phone normalisation.
 *
 * Accepts what an Uzbek user actually types: `901234567`, `+998901234567`,
 * `998 90 123 45 67`, `(90) 123-45-67`. Anything that resolves to a plausible
 * international number is kept in `+<digits>` form so the platform and the panel
 * always see one shape.
 */
export function validatePhone(raw: string): StepResult<string> {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return { ok: false, error: 'required' };

  // 9 national digits -> Uzbek subscriber number.
  if (digits.length === 9) return { ok: true, value: `+998${digits}` };

  // 12 digits starting with the Uzbek country code.
  if (digits.length === 12 && digits.startsWith('998')) {
    return { ok: true, value: `+${digits}` };
  }

  // Any other plausible international number, so a foreign institution is not
  // locked out by a rule written for Uzbekistan.
  if (digits.length >= 10 && digits.length <= 15) return { ok: true, value: `+${digits}` };

  return { ok: false, error: 'phone_format' };
}

export function fileExtension(fileName: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(fileName.trim());
  return match ? match[1].toLowerCase() : '';
}

export function validateCharterFile(file: {
  fileName: string;
  sizeBytes: number;
}): StepResult<{ fileName: string; sizeBytes: number }> {
  const extension = fileExtension(file.fileName);
  if (!(ALLOWED_CHARTER_EXTENSIONS as readonly string[]).includes(extension)) {
    return { ok: false, error: 'file_type' };
  }
  if (file.sizeBytes <= 0) return { ok: false, error: 'required' };
  if (file.sizeBytes > MAX_CHARTER_SIZE_BYTES) return { ok: false, error: 'file_too_large' };
  return { ok: true, value: file };
}

// ---------------------------------------------------------------------------
// Completeness
// ---------------------------------------------------------------------------

/**
 * Every field the platform requires. `middleName` is deliberately absent: a
 * person without a sharif must still be able to apply.
 */
export function missingFields(draft: WizardDraft): WizardStep[] {
  const missing: WizardStep[] = [];
  if (!draft.organizationType) missing.push('org_type');
  if (!draft.organizationName) missing.push('org_name');
  if (!draft.stir) missing.push('stir');
  if (!draft.lastName) missing.push('resp_last_name');
  if (!draft.firstName) missing.push('resp_first_name');
  if (!draft.phone) missing.push('resp_phone');
  if (!draft.charter) missing.push('charter');
  return missing;
}

export function isSubmittable(draft: WizardDraft): boolean {
  return missingFields(draft).length === 0;
}

function collapseWhitespace(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}
