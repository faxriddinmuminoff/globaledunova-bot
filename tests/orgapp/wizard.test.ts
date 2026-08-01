import { describe, it, expect } from 'vitest';
import {
  createWizard,
  fileExtension,
  isFirstStep,
  isSubmittable,
  missingFields,
  nextStep,
  previousStep,
  stepPosition,
  validateCharterFile,
  validateNamePart,
  validateOrganizationName,
  validateOrganizationType,
  validatePhone,
  validateStir,
} from '../../src/orgapp/wizard';
import {
  MAX_CHARTER_SIZE_BYTES,
  MAX_NAME_PART_LENGTH,
  MAX_ORGANIZATION_NAME_LENGTH,
  WIZARD_STEPS,
  WizardDraft,
  WizardStep,
} from '../../src/orgapp/types';

describe('wizard navigation', () => {
  it('starts on the organization type step with an idempotency key', () => {
    const wizard = createWizard();
    expect(wizard.step).toBe('org_type');
    expect(wizard.draft).toEqual({});
    expect(wizard.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('gives each wizard its own idempotency key', () => {
    expect(createWizard().idempotencyKey).not.toBe(createWizard().idempotencyKey);
  });

  it('walks forward through every step in order', () => {
    let step: WizardStep = WIZARD_STEPS[0];
    const visited: WizardStep[] = [step];
    for (let i = 0; i < WIZARD_STEPS.length; i += 1) {
      const advanced = nextStep(step);
      if (advanced === step) break;
      step = advanced;
      visited.push(step);
    }
    expect(visited).toEqual([...WIZARD_STEPS]);
  });

  it('stays on confirm instead of walking past the end', () => {
    expect(nextStep('confirm')).toBe('confirm');
  });

  it('stays on the first step instead of walking before the start', () => {
    expect(previousStep('org_type')).toBe('org_type');
    expect(isFirstStep('org_type')).toBe(true);
    expect(isFirstStep('stir')).toBe(false);
  });

  it('walks backward one step at a time', () => {
    expect(previousStep('stir')).toBe('org_name');
    expect(previousStep('confirm')).toBe('charter');
  });

  it('reports a 1-based position', () => {
    expect(stepPosition('org_type')).toEqual({ current: 1, total: 9 });
    expect(stepPosition('confirm')).toEqual({ current: 9, total: 9 });
  });
});

describe('organization type', () => {
  it.each(['university', 'institute', 'college', 'training-center', 'corporate-academy', 'other'])(
    'accepts %s',
    (value) => {
      expect(validateOrganizationType(value)).toEqual({ ok: true, value });
    },
  );

  it('rejects an unknown type', () => {
    expect(validateOrganizationType('kindergarten').ok).toBe(false);
    expect(validateOrganizationType('').error).toBe('required');
  });
});

describe('organization name', () => {
  it('collapses inner whitespace and trims', () => {
    expect(validateOrganizationName('  Toshkent   moliya   instituti ')).toEqual({
      ok: true,
      value: 'Toshkent moliya instituti',
    });
  });

  it('rejects blank input', () => {
    expect(validateOrganizationName('   ').error).toBe('required');
  });

  it('rejects a name past the length ceiling but accepts one exactly at it', () => {
    expect(validateOrganizationName('a'.repeat(MAX_ORGANIZATION_NAME_LENGTH)).ok).toBe(true);
    expect(validateOrganizationName('a'.repeat(MAX_ORGANIZATION_NAME_LENGTH + 1)).error).toBe(
      'too_long',
    );
  });
});

describe('STIR', () => {
  it('strips spaces and dashes people copy from documents', () => {
    expect(validateStir(' 305 447-892 ')).toEqual({ ok: true, value: '305447892' });
  });

  it('accepts 9 through 14 digits', () => {
    expect(validateStir('123456789').ok).toBe(true);
    expect(validateStir('12345678901234').ok).toBe(true);
  });

  it('rejects lengths outside the range', () => {
    expect(validateStir('12345678').error).toBe('stir_format');
    expect(validateStir('123456789012345').error).toBe('stir_format');
  });

  it('rejects letters', () => {
    expect(validateStir('30544789A').error).toBe('stir_format');
  });

  it('reports blank input as required, not as a format problem', () => {
    expect(validateStir('  -  ').error).toBe('required');
  });
});

describe('name parts', () => {
  it('requires a surname and a given name', () => {
    expect(validateNamePart('', true).error).toBe('required');
  });

  it('allows an empty sharif, because not every person has one', () => {
    expect(validateNamePart('', false)).toEqual({ ok: true, value: '' });
    expect(validateNamePart('   ', false)).toEqual({ ok: true, value: '' });
  });

  it('enforces the length ceiling', () => {
    expect(validateNamePart('a'.repeat(MAX_NAME_PART_LENGTH), true).ok).toBe(true);
    expect(validateNamePart('a'.repeat(MAX_NAME_PART_LENGTH + 1), true).error).toBe('too_long');
  });
});

describe('phone', () => {
  it.each([
    ['901234567', '+998901234567'],
    ['+998901234567', '+998901234567'],
    ['998 90 123 45 67', '+998901234567'],
    ['(90) 123-45-67 ', '+998901234567'],
    ['+90 555 123 45 67', '+905551234567'],
  ])('normalises %s to %s', (raw, expected) => {
    expect(validatePhone(raw)).toEqual({ ok: true, value: expected });
  });

  it('rejects a number that is too short to be real', () => {
    expect(validatePhone('12345').error).toBe('phone_format');
  });

  it('rejects a number that is too long to be real', () => {
    expect(validatePhone('1'.repeat(16)).error).toBe('phone_format');
  });

  it('reports input with no digits at all as required', () => {
    expect(validatePhone('salom').error).toBe('required');
  });
});

describe('charter file', () => {
  it.each(['ustav.pdf', 'USTAV.PDF', 'scan.jpg', 'scan.jpeg', 'scan.png'])(
    'accepts %s',
    (fileName) => {
      expect(validateCharterFile({ fileName, sizeBytes: 1024 }).ok).toBe(true);
    },
  );

  it.each(['ustav.docx', 'ustav.zip', 'ustav.exe', 'ustav'])('rejects %s', (fileName) => {
    expect(validateCharterFile({ fileName, sizeBytes: 1024 }).error).toBe('file_type');
  });

  it('rejects a file above the Telegram download ceiling', () => {
    expect(
      validateCharterFile({ fileName: 'ustav.pdf', sizeBytes: MAX_CHARTER_SIZE_BYTES + 1 }).error,
    ).toBe('file_too_large');
    expect(
      validateCharterFile({ fileName: 'ustav.pdf', sizeBytes: MAX_CHARTER_SIZE_BYTES }).ok,
    ).toBe(true);
  });

  it('rejects an empty file', () => {
    expect(validateCharterFile({ fileName: 'ustav.pdf', sizeBytes: 0 }).error).toBe('required');
  });

  it('reads the extension case-insensitively and ignores dots in the name', () => {
    expect(fileExtension('ustav.2026.final.PDF')).toBe('pdf');
    expect(fileExtension('noextension')).toBe('');
  });
});

describe('completeness', () => {
  const full: WizardDraft = {
    organizationType: 'institute',
    organizationName: 'Toshkent moliya instituti',
    stir: '305447892',
    lastName: 'Karimov',
    firstName: 'Jasur',
    middleName: 'Anvarovich',
    phone: '+998712001020',
    charter: {
      documentType: 'charter',
      uploadedAt: '2026-07-30T10:00:00.000Z',
      fileName: 'ustav.pdf',
      storageRef: 'local://a.pdf',
      sizeBytes: 10,
      sha256: 'c'.repeat(64),
    },
  };

  it('accepts a complete draft', () => {
    expect(missingFields(full)).toEqual([]);
    expect(isSubmittable(full)).toBe(true);
  });

  it('does not require the sharif', () => {
    const { middleName, ...rest } = full;
    expect(isSubmittable(rest)).toBe(true);
  });

  it('lists every missing field for an empty draft, in step order', () => {
    expect(missingFields({})).toEqual([
      'org_type',
      'org_name',
      'stir',
      'resp_last_name',
      'resp_first_name',
      'resp_phone',
      'charter',
    ]);
  });

  it('refuses to submit without the charter document', () => {
    const { charter, ...rest } = full;
    expect(missingFields(rest)).toEqual(['charter']);
    expect(isSubmittable(rest)).toBe(false);
  });
});
