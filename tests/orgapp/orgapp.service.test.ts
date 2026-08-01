import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StubPlatformClient } from '../../src/platform/stub-platform-client';
import {
  resetPlatformClientForTests,
  setPlatformClientForTests,
} from '../../src/platform/platform.factory';
import { MemoryOrgApplicationStore } from '../../src/orgapp/memory-orgapp.store';
import { setOrgApplicationStoreForTests } from '../../src/orgapp/orgapp-store.factory';
import {
  listApplicationsFor,
  listOpenApplications,
  refreshApplication,
  submitApplication,
} from '../../src/orgapp/orgapp.service';
import { WizardDraft } from '../../src/orgapp/types';
import { PlatformClient } from '../../src/platform/platform-client.interface';
import { PlatformError } from '../../src/platform/types';

function draft(overrides: Partial<WizardDraft> = {}): WizardDraft {
  return {
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
      storageRef: 'local://org-apps/abc.pdf',
      sizeBytes: 1024,
      sha256: 'd'.repeat(64),
    },
    ...overrides,
  };
}

let platform: StubPlatformClient;
let store: MemoryOrgApplicationStore;

beforeEach(() => {
  platform = new StubPlatformClient();
  store = new MemoryOrgApplicationStore();
  setPlatformClientForTests(platform);
  setOrgApplicationStoreForTests(store);
});

afterEach(() => {
  resetPlatformClientForTests();
  setOrgApplicationStoreForTests(null);
});

describe('submitApplication', () => {
  it('submits and stores a platform-issued application', async () => {
    const outcome = await submitApplication({
      telegramId: 42,
      idempotencyKey: 'key-a',
      draft: draft(),
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.record.applicationId).toBeTruthy();
    expect(outcome.record.status).toBe('submitted');
    expect(outcome.record.contactTelegramId).toBe(42);
    // Composed in the platform's canonical order.
    expect(outcome.record.responsibleFullName).toBe('Karimov Jasur Anvarovich');
    // The submitted status counts as already announced.
    expect(outcome.record.notifiedStatuses).toEqual(['submitted']);

    expect(await store.countAll()).toBe(1);
  });

  it('composes the name without the sharif when there is none', async () => {
    const outcome = await submitApplication({
      telegramId: 42,
      idempotencyKey: 'key-a',
      draft: draft({ middleName: '' }),
    });

    expect(outcome.ok && outcome.record.responsibleFullName).toBe('Karimov Jasur');
  });

  it('refuses an incomplete draft without calling the platform', async () => {
    const outcome = await submitApplication({
      telegramId: 42,
      idempotencyKey: 'key-a',
      draft: draft({ charter: undefined }),
    });

    expect(outcome).toEqual({ ok: false, reason: 'incomplete' });
    expect(await store.countAll()).toBe(0);
  });

  it('maps a duplicate STIR to stir_taken and stores nothing', async () => {
    await submitApplication({ telegramId: 1, idempotencyKey: 'k1', draft: draft() });

    const second = await submitApplication({
      telegramId: 2,
      idempotencyKey: 'k2',
      draft: draft({ organizationName: 'Boshqa institut' }),
    });

    expect(second).toEqual({ ok: false, reason: 'stir_taken' });
    expect(await store.countAll()).toBe(1);
  });

  it('does not create a second row when the same key is replayed', async () => {
    const first = await submitApplication({
      telegramId: 1,
      idempotencyKey: 'same-key',
      draft: draft(),
    });
    const replay = await submitApplication({
      telegramId: 1,
      idempotencyKey: 'same-key',
      draft: draft(),
    });

    expect(first.ok && replay.ok).toBe(true);
    if (first.ok && replay.ok) {
      expect(replay.record.applicationId).toBe(first.record.applicationId);
    }
    expect(await store.countAll()).toBe(1);
  });

  it.each([
    ['unavailable', 'unavailable'],
    ['timeout', 'unavailable'],
    ['unauthorized', 'unavailable'],
    ['validation_failed', 'validation'],
    ['unknown', 'unknown'],
  ])('maps platform error %s to reason %s', async (code, reason) => {
    const failing: PlatformClient = {
      kind: 'stub',
      createOrganizationApplication: async () => {
        throw new PlatformError(code as never, 'boom');
      },
      getOrganizationApplicationStatus: async () => {
        throw new Error('unused');
      },
      healthCheck: async () => false,
    };
    setPlatformClientForTests(failing);

    const outcome = await submitApplication({
      telegramId: 1,
      idempotencyKey: 'k',
      draft: draft(),
    });
    expect(outcome).toEqual({ ok: false, reason });
    expect(await store.countAll()).toBe(0);
  });

  it('maps a non-PlatformError throw to unknown instead of crashing', async () => {
    const failing: PlatformClient = {
      kind: 'stub',
      createOrganizationApplication: async () => {
        throw new TypeError('undefined is not a function');
      },
      getOrganizationApplicationStatus: async () => {
        throw new Error('unused');
      },
      healthCheck: async () => false,
    };
    setPlatformClientForTests(failing);

    expect(
      await submitApplication({ telegramId: 1, idempotencyKey: 'k', draft: draft() }),
    ).toEqual({ ok: false, reason: 'unknown' });
  });
});

describe('refreshApplication', () => {
  async function submitted(): Promise<string> {
    const outcome = await submitApplication({
      telegramId: 7,
      idempotencyKey: 'k',
      draft: draft(),
    });
    if (!outcome.ok) throw new Error('setup failed');
    return outcome.record.applicationId;
  }

  it('returns null for an application the bot does not know', async () => {
    expect(await refreshApplication('unknown-id')).toBeNull();
  });

  it('reports no notification when nothing changed', async () => {
    const id = await submitted();
    const transition = await refreshApplication(id);

    expect(transition?.record.status).toBe('submitted');
    expect(transition?.shouldNotify).toBe(false);
  });

  it('reports a notification exactly once per new status', async () => {
    const id = await submitted();
    platform.setStatus(id, 'platform_admin_review');

    const first = await refreshApplication(id);
    expect(first?.previousStatus).toBe('submitted');
    expect(first?.record.status).toBe('platform_admin_review');
    expect(first?.shouldNotify).toBe(true);

    // A second poll with no further change must stay silent.
    const second = await refreshApplication(id);
    expect(second?.shouldNotify).toBe(false);
  });

  it('does not re-announce a stage the applicant already saw, even if it recurs', async () => {
    const id = await submitted();

    platform.setStatus(id, 'ready_for_owner');
    expect((await refreshApplication(id))?.shouldNotify).toBe(true);

    platform.setStatus(id, 'system_verify_passed');
    expect((await refreshApplication(id))?.shouldNotify).toBe(true);

    // Back to a stage already announced — a raw change, nothing new to say.
    platform.setStatus(id, 'owner_pending');
    expect((await refreshApplication(id))?.shouldNotify).toBe(false);
  });

  it('stays silent when the raw stage moves but the applicant would see no change', async () => {
    const id = await submitted();

    // draft -> submitted -> system_verify_running all read as "submitted".
    platform.setStatus(id, 'system_verify_running');
    const transition = await refreshApplication(id);

    expect(transition?.previousStatus).toBe('submitted');
    expect(transition?.record.status).toBe('system_verify_running');
    expect(transition?.shouldNotify).toBe(false);
  });

  it('carries the rejection reason and the activated organization id through', async () => {
    const id = await submitted();

    platform.setStatus(id, 'owner_rejected', { rejectionReason: 'Ustav noaniq' });
    const rejected = await refreshApplication(id);
    expect(rejected?.record.rejectionReason).toBe('Ustav noaniq');

    platform.setStatus(id, 'activated', { organizationId: 'org-77' });
    const activated = await refreshApplication(id);
    expect(activated?.record.organizationId).toBe('org-77');
  });

  it('returns null when the platform is unreachable, so it is not read as "no change"', async () => {
    const id = await submitted();
    setPlatformClientForTests({
      kind: 'http',
      createOrganizationApplication: async () => {
        throw new Error('unused');
      },
      getOrganizationApplicationStatus: async () => {
        throw new PlatformError('unavailable', 'down');
      },
      healthCheck: async () => false,
    });

    expect(await refreshApplication(id)).toBeNull();
    // The stored status must be untouched by a failed poll.
    expect((await store.findById(id))!.status).toBe('submitted');
  });

  it('keeps the row when the platform reports not_found', async () => {
    const id = await submitted();
    setPlatformClientForTests({
      kind: 'http',
      createOrganizationApplication: async () => {
        throw new Error('unused');
      },
      getOrganizationApplicationStatus: async () => {
        throw new PlatformError('not_found', 'gone');
      },
      healthCheck: async () => false,
    });

    expect(await refreshApplication(id)).toBeNull();
    expect(await store.findById(id)).not.toBeNull();
  });
});

describe('listing', () => {
  it('drops an application out of the open list once it reaches a terminal stage', async () => {
    const outcome = await submitApplication({
      telegramId: 7,
      idempotencyKey: 'k',
      draft: draft(),
    });
    if (!outcome.ok) throw new Error('setup failed');

    expect(await listOpenApplications()).toHaveLength(1);

    platform.setStatus(outcome.record.applicationId, 'activated');
    await refreshApplication(outcome.record.applicationId);

    expect(await listOpenApplications()).toHaveLength(0);
    // Still visible to the applicant.
    expect(await listApplicationsFor(7)).toHaveLength(1);
  });

  it('shows an applicant only their own applications', async () => {
    await submitApplication({ telegramId: 1, idempotencyKey: 'k1', draft: draft() });
    await submitApplication({
      telegramId: 2,
      idempotencyKey: 'k2',
      draft: draft({ stir: '308912455' }),
    });

    expect(await listApplicationsFor(1)).toHaveLength(1);
    expect(await listApplicationsFor(2)).toHaveLength(1);
    expect(await listApplicationsFor(3)).toHaveLength(0);
  });
});
