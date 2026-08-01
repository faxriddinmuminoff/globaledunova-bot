import { describe, it, expect, beforeEach } from 'vitest';
import { StubPlatformClient } from '../../src/platform/stub-platform-client';
import {
  CreateApplicationInput,
  PlatformError,
  composeFullName,
  isTerminalStatus,
  isValidStir,
  needsApplicantAction,
  toBotStatus,
  toDocumentPayload,
} from '../../src/platform/types';

function input(overrides: Partial<CreateApplicationInput> = {}): CreateApplicationInput {
  return {
    idempotencyKey: 'key-1',
    organizationName: 'Toshkent xalqaro moliya instituti',
    organizationType: 'institute',
    stir: '305447892',
    responsiblePersonName: 'Karimov Jasur Anvarovich',
    phone: '+998712001020',
    contactTelegramId: 555,
    documents: [
      {
        documentType: 'charter',
        storageRef: 'local://org-apps/ab12.pdf',
        uploadedAt: '2026-07-30T10:00:00.000Z',
        sha256: 'a'.repeat(64),
      },
    ],
    ...overrides,
  };
}

describe('StubPlatformClient', () => {
  let client: StubPlatformClient;

  beforeEach(() => {
    client = new StubPlatformClient();
  });

  it('creates an application in submitted state', async () => {
    const result = await client.createOrganizationApplication(input());

    expect(result.applicationId).toBeTruthy();
    expect(result.status).toBe('submitted');
  });

  it('returns the SAME application when the idempotency key is replayed', async () => {
    const first = await client.createOrganizationApplication(input());
    const replay = await client.createOrganizationApplication(
      // A Telegram retry resends identical content under the same key.
      input({ idempotencyKey: 'key-1' }),
    );

    expect(replay.applicationId).toBe(first.applicationId);
  });

  it('rejects a second application for the same STIR with stir_taken', async () => {
    await client.createOrganizationApplication(input());

    await expect(
      client.createOrganizationApplication(
        input({ idempotencyKey: 'key-2', organizationName: 'Boshqa institut' }),
      ),
    ).rejects.toMatchObject({ code: 'stir_taken', httpStatus: 409 });
  });

  it('allows a different STIR through', async () => {
    await client.createOrganizationApplication(input());
    const second = await client.createOrganizationApplication(
      input({ idempotencyKey: 'key-2', stir: '308912455' }),
    );

    expect(second.status).toBe('submitted');
  });

  it.each([
    ['organizationName', { organizationName: '   ' }],
    ['stir', { stir: '   ' }],
    ['responsiblePersonName', { responsiblePersonName: '' }],
    ['phone', { phone: '' }],
  ])('rejects a missing %s', async (_field, patch) => {
    await expect(
      client.createOrganizationApplication(input(patch)),
    ).rejects.toMatchObject({ code: 'validation_failed', httpStatus: 422 });
  });

  it.each([
    ['too short', '12345678'],
    ['too long', '123456789012345'],
    ['not numeric', '30544789A'],
  ])('ACCEPTS a STIR that is %s, because the platform checks format at verify', async (_l, stir) => {
    // The platform's intake only strips whitespace; STIR_FORMAT_VALID is a rule
    // of the later verification step. The bot rejects these in the wizard, long
    // before this call — but the contract must not pretend otherwise.
    const result = await client.createOrganizationApplication(input({ stir }));
    expect(result.status).toBe('submitted');
  });

  it('accepts an application with no documents, because DOCUMENTS_PRESENT is a verify rule', async () => {
    const result = await client.createOrganizationApplication(input({ documents: [] }));
    expect(result.status).toBe('submitted');
  });

  it('reports every failing field at once', async () => {
    try {
      await client.createOrganizationApplication(
        input({
          organizationName: '   ',
          stir: '   ',
          responsiblePersonName: '',
          phone: '',
        }),
      );
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PlatformError);
      const fields = (error as PlatformError).fields ?? {};
      expect(Object.keys(fields).sort()).toEqual([
        'organizationName',
        'phone',
        'responsiblePersonName',
        'stir',
      ]);
    }
  });

  it('does not consume the STIR when validation fails', async () => {
    await expect(
      client.createOrganizationApplication(input({ phone: '' })),
    ).rejects.toThrow();

    // The same STIR must still be usable once the applicant fixes the problem.
    const retry = await client.createOrganizationApplication(
      input({ idempotencyKey: 'key-retry' }),
    );
    expect(retry.status).toBe('submitted');
  });

  it('reads back a status and reflects panel-side stage changes', async () => {
    const created = await client.createOrganizationApplication(input());

    client.setStatus(created.applicationId, 'platform_admin_review');
    let status = await client.getOrganizationApplicationStatus(created.applicationId);
    expect(status.status).toBe('platform_admin_review');

    client.setStatus(created.applicationId, 'activated', { organizationId: 'org-1' });
    status = await client.getOrganizationApplicationStatus(created.applicationId);
    expect(status.status).toBe('activated');
    expect(status.organizationId).toBe('org-1');
  });

  it('carries a rejection reason through', async () => {
    const created = await client.createOrganizationApplication(input());
    client.setStatus(created.applicationId, 'owner_rejected', {
      rejectionReason: 'Ustav nusxasi o‘qilmadi',
    });

    const status = await client.getOrganizationApplicationStatus(created.applicationId);
    expect(status.rejectionReason).toBe('Ustav nusxasi o‘qilmadi');
  });

  it('throws not_found for an unknown application', async () => {
    await expect(
      client.getOrganizationApplicationStatus('nope'),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('contract helpers', () => {
  it('composes a name in Familiya Ism Otasining-ismi order', () => {
    expect(
      composeFullName({ lastName: 'Sobirov', firstName: 'Aziz', middleName: 'Rustamovich' }),
    ).toBe('Sobirov Aziz Rustamovich');
  });

  it('skips blank name parts instead of leaving double spaces', () => {
    expect(composeFullName({ lastName: 'Sobirov', firstName: 'Aziz', middleName: '  ' })).toBe(
      'Sobirov Aziz',
    );
  });

  it('accepts STIR values of 9 to 14 digits only', () => {
    expect(isValidStir('123456789')).toBe(true);
    expect(isValidStir('12345678901234')).toBe(true);
    expect(isValidStir('12345678')).toBe(false);
    expect(isValidStir('123456789012345')).toBe(false);
    expect(isValidStir(' 305 447 892 ')).toBe(true);
  });

  it('sends only the four document keys the platform keeps', () => {
    const payload = toDocumentPayload({
      documentType: 'charter',
      storageRef: 'local://org-apps/x.pdf',
      uploadedAt: '2026-07-30T10:00:00.000Z',
      sha256: 'b'.repeat(64),
      fileName: 'ustav.pdf',
      sizeBytes: 1024,
    });

    // fileName and sizeBytes are the bot's own; the platform's normalizer would
    // drop them silently, which reads as "sent" but is not.
    expect(Object.keys(payload).sort()).toEqual([
      'documentType',
      'sha256',
      'storageRef',
      'uploadedAt',
    ]);
  });
});

describe('status mapping', () => {
  it('collapses the three pre-verification stages into one visible stage', () => {
    expect(toBotStatus('draft')).toBe('submitted');
    expect(toBotStatus('submitted')).toBe('submitted');
    expect(toBotStatus('system_verify_running')).toBe('submitted');
  });

  it('collapses passed-verification and PA review into "in review"', () => {
    expect(toBotStatus('system_verify_passed')).toBe('in_review');
    expect(toBotStatus('platform_admin_review')).toBe('in_review');
  });

  it('collapses both pre-owner stages into "awaiting owner"', () => {
    expect(toBotStatus('ready_for_owner')).toBe('awaiting_owner');
    expect(toBotStatus('owner_pending')).toBe('awaiting_owner');
  });

  it.each([
    ['system_verify_blocked', 'verify_failed'],
    ['platform_admin_rejected', 'pa_rejected'],
    ['owner_approved', 'owner_approved'],
    ['owner_rejected', 'rejected'],
    ['return_for_correction', 'needs_correction'],
    ['activated', 'activated'],
    ['archived', 'archived'],
  ] as const)('maps %s to %s', (raw, visible) => {
    expect(toBotStatus(raw)).toBe(visible);
  });

  it('marks exactly the two stages the applicant must act on', () => {
    // These are the two the platform's own validateSubmitCorrection accepts.
    expect(needsApplicantAction('system_verify_blocked')).toBe(true);
    expect(needsApplicantAction('return_for_correction')).toBe(true);

    expect(needsApplicantAction('submitted')).toBe(false);
    expect(needsApplicantAction('platform_admin_review')).toBe(false);
    expect(needsApplicantAction('owner_rejected')).toBe(false);
    expect(needsApplicantAction('activated')).toBe(false);
  });

  it('marks as terminal only the stages with no way forward', () => {
    // Both rejections are terminal: the platform has no resume path out of
    // either, only out of return_for_correction and system_verify_blocked.
    expect(isTerminalStatus('platform_admin_rejected')).toBe(true);
    expect(isTerminalStatus('owner_rejected')).toBe(true);
    expect(isTerminalStatus('activated')).toBe(true);
    expect(isTerminalStatus('archived')).toBe(true);

    // Correctable — keep polling, the applicant may fix it.
    expect(isTerminalStatus('system_verify_blocked')).toBe(false);
    expect(isTerminalStatus('return_for_correction')).toBe(false);

    // In motion.
    expect(isTerminalStatus('submitted')).toBe(false);
    expect(isTerminalStatus('platform_admin_review')).toBe(false);
    expect(isTerminalStatus('owner_approved')).toBe(false);
  });
});
