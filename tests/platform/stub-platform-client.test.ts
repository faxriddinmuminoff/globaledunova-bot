import { describe, it, expect, beforeEach } from 'vitest';
import { StubPlatformClient } from '../../src/platform/stub-platform-client';
import {
  CreateApplicationInput,
  PlatformError,
  composeFullName,
  isTerminalStatus,
  isValidStir,
} from '../../src/platform/types';

function input(overrides: Partial<CreateApplicationInput> = {}): CreateApplicationInput {
  return {
    idempotencyKey: 'key-1',
    organizationName: 'Toshkent xalqaro moliya instituti',
    organizationType: 'institute',
    stir: '305447892',
    responsible: {
      lastName: 'Karimov',
      firstName: 'Jasur',
      middleName: 'Anvarovich',
      phone: '+998712001020',
    },
    contactTelegramId: 555,
    documents: [
      {
        kind: 'charter',
        fileName: 'ustav.pdf',
        storageRef: 'local://org-apps/2026/ab12.pdf',
        sizeBytes: 184320,
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
    ['too short', '12345678'],
    ['too long', '123456789012345'],
    ['not numeric', '30544789A'],
    ['empty', ''],
  ])('rejects a STIR that is %s', async (_label, stir) => {
    await expect(
      client.createOrganizationApplication(input({ stir })),
    ).rejects.toMatchObject({ code: 'validation_failed', httpStatus: 422 });
  });

  it('requires at least one document', async () => {
    await expect(
      client.createOrganizationApplication(input({ documents: [] })),
    ).rejects.toMatchObject({ code: 'validation_failed' });
  });

  it('reports every failing field at once', async () => {
    try {
      await client.createOrganizationApplication(
        input({
          organizationName: '   ',
          stir: 'abc',
          responsible: { lastName: '', firstName: '', middleName: '', phone: '' },
          documents: [],
        }),
      );
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PlatformError);
      const fields = (error as PlatformError).fields ?? {};
      expect(Object.keys(fields).sort()).toEqual([
        'documents',
        'firstName',
        'lastName',
        'organizationName',
        'phone',
        'stir',
      ]);
    }
  });

  it('does not consume the STIR when validation fails', async () => {
    await expect(
      client.createOrganizationApplication(input({ documents: [] })),
    ).rejects.toThrow();

    // The same STIR must still be usable once the applicant fixes the problem.
    const retry = await client.createOrganizationApplication(
      input({ idempotencyKey: 'key-retry' }),
    );
    expect(retry.status).toBe('submitted');
  });

  it('reads back a status and reflects panel-side stage changes', async () => {
    const created = await client.createOrganizationApplication(input());

    client.setStatus(created.applicationId, 'pa_approved');
    let status = await client.getOrganizationApplicationStatus(created.applicationId);
    expect(status.status).toBe('pa_approved');

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
    expect(isValidStir(' 305447892 ')).toBe(true);
  });

  it('marks only end-of-pipeline stages as terminal', () => {
    expect(isTerminalStatus('activated')).toBe(true);
    expect(isTerminalStatus('owner_rejected')).toBe(true);
    expect(isTerminalStatus('verify_failed')).toBe(true);
    expect(isTerminalStatus('pa_rejected')).toBe(true);
    // Owner approval is followed by activation, so it is NOT terminal.
    expect(isTerminalStatus('owner_approved')).toBe(false);
    expect(isTerminalStatus('submitted')).toBe(false);
    expect(isTerminalStatus('pa_approved')).toBe(false);
  });
});
