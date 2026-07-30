import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StubPlatformClient } from '../../src/platform/stub-platform-client';
import {
  resetPlatformClientForTests,
  setPlatformClientForTests,
} from '../../src/platform/platform.factory';
import { MemoryOrgApplicationStore } from '../../src/orgapp/memory-orgapp.store';
import { setOrgApplicationStoreForTests } from '../../src/orgapp/orgapp-store.factory';
import { submitApplication } from '../../src/orgapp/orgapp.service';
import { pollOpenApplications } from '../../src/orgapp/poller';
import { WizardDraft } from '../../src/orgapp/types';
import { PlatformError } from '../../src/platform/types';
import { config } from '../../src/config';
import { Language } from '../../src/types';

function draft(stir: string): WizardDraft {
  return {
    organizationType: 'college',
    organizationName: `Kollej ${stir}`,
    stir,
    lastName: 'Rustamova',
    firstName: 'Nigora',
    middleName: '',
    phone: '+998662213040',
    charter: {
      kind: 'charter',
      fileName: 'ustav.pdf',
      storageRef: 'local://org-apps/x.pdf',
      sizeBytes: 100,
      sha256: 'e'.repeat(64),
    },
  };
}

let platform: StubPlatformClient;
let store: MemoryOrgApplicationStore;
const resolveLanguage = async (): Promise<Language> => 'uz';

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

async function submit(telegramId: number, stir: string): Promise<string> {
  const outcome = await submitApplication({
    telegramId,
    idempotencyKey: `key-${stir}`,
    draft: draft(stir),
  });
  if (!outcome.ok) throw new Error(`setup failed: ${outcome.reason}`);
  return outcome.record.applicationId;
}

describe('pollOpenApplications', () => {
  it('does nothing when there is nothing open', async () => {
    const notify = vi.fn();
    expect(await pollOpenApplications(notify, resolveLanguage)).toEqual({
      checked: 0,
      changed: 0,
      notified: 0,
      skippedTooOld: 0,
      failed: 0,
    });
    expect(notify).not.toHaveBeenCalled();
  });

  it('checks an open application and stays silent when nothing moved', async () => {
    await submit(1, '100000001');
    const notify = vi.fn();

    const result = await pollOpenApplications(notify, resolveLanguage);
    expect(result.checked).toBe(1);
    expect(result.changed).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it('notifies the applicant once when the stage moves', async () => {
    const id = await submit(555, '100000002');
    platform.setStatus(id, 'pa_approved');

    const notify = vi.fn();
    const first = await pollOpenApplications(notify, resolveLanguage);

    expect(first.changed).toBe(1);
    expect(first.notified).toBe(1);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toBe(555);
    expect(notify.mock.calls[0][1]).toContain('Platforma admini ma');

    // A second pass with no further change must not message them again.
    const second = await pollOpenApplications(notify, resolveLanguage);
    expect(second.notified).toBe(0);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('includes the rejection reason in the message', async () => {
    const id = await submit(1, '100000003');
    platform.setStatus(id, 'owner_rejected', { rejectionReason: 'Ustav nusxasi noaniq' });

    const notify = vi.fn();
    await pollOpenApplications(notify, resolveLanguage);

    expect(notify.mock.calls[0][1]).toContain('Ustav nusxasi noaniq');
  });

  it('adds the credentials note when the tenant is activated', async () => {
    const id = await submit(1, '100000004');
    platform.setStatus(id, 'activated', { organizationId: 'org-1' });

    const notify = vi.fn();
    await pollOpenApplications(notify, resolveLanguage);

    // The activation message must say credentials do NOT come through the bot.
    expect(notify.mock.calls[0][1]).toContain('bot orqali emas');
  });

  it('stops polling an application once it is terminal', async () => {
    const id = await submit(1, '100000005');
    platform.setStatus(id, 'activated');
    await pollOpenApplications(vi.fn(), resolveLanguage);

    const after = await pollOpenApplications(vi.fn(), resolveLanguage);
    expect(after.checked).toBe(0);
  });

  it('keeps going after one application fails', async () => {
    await submit(1, '100000006');
    const goodId = await submit(2, '100000007');
    platform.setStatus(goodId, 'pa_approved');

    const notify = vi
      .fn()
      // The first notification attempt explodes; the pass must not stop there.
      .mockRejectedValueOnce(new Error('telegram 403: bot was blocked'))
      .mockResolvedValue(undefined);

    const brokenId = await submit(3, '100000008');
    platform.setStatus(brokenId, 'verify_passed');

    const result = await pollOpenApplications(notify, resolveLanguage);

    expect(result.checked).toBe(3);
    expect(result.failed).toBe(1);
    // Two moved, one of the notifications threw, so exactly one was delivered.
    expect(result.notified).toBe(1);
  });

  it('does not treat an unreachable platform as a change', async () => {
    await submit(1, '100000009');
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

    const notify = vi.fn();
    const result = await pollOpenApplications(notify, resolveLanguage);

    expect(result.checked).toBe(1);
    expect(result.changed).toBe(0);
    expect(result.failed).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it('skips an application older than the polling age limit', async () => {
    const id = await submit(1, '100000010');
    platform.setStatus(id, 'pa_approved');

    const notify = vi.fn();
    const farFuture = Date.now() + config.PLATFORM_POLL_MAX_AGE_MS + 60_000;
    const result = await pollOpenApplications(notify, resolveLanguage, farFuture);

    expect(result.skippedTooOld).toBe(1);
    expect(result.checked).toBe(0);
    expect(notify).not.toHaveBeenCalled();

    // It is skipped, not deleted — the applicant can still see it.
    expect(await store.countAll()).toBe(1);
  });

  it('uses each applicant\'s own language', async () => {
    const id = await submit(777, '100000011');
    platform.setStatus(id, 'activated');

    const notify = vi.fn();
    await pollOpenApplications(notify, async () => 'en');

    expect(notify.mock.calls[0][1]).toContain('Activated');
    expect(notify.mock.calls[0][1]).toContain('not through this bot');
  });

  it('survives a language lookup failure by counting it as a failed row', async () => {
    const id = await submit(1, '100000012');
    platform.setStatus(id, 'pa_approved');

    const notify = vi.fn();
    const result = await pollOpenApplications(notify, async () => {
      throw new Error('db down');
    });

    expect(result.failed).toBe(1);
    expect(notify).not.toHaveBeenCalled();
  });
});
