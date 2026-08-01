import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MemoryOrgApplicationStore } from '../../src/orgapp/memory-orgapp.store';
import { JsonOrgApplicationStore } from '../../src/orgapp/json-orgapp.store';
import { OrgApplicationRecord } from '../../src/orgapp/types';

function record(overrides: Partial<OrgApplicationRecord> = {}): OrgApplicationRecord {
  return {
    applicationId: 'app-1',
    contactTelegramId: 500,
    organizationName: 'Toshkent moliya instituti',
    organizationType: 'institute',
    stir: '305447892',
    responsibleFullName: 'Karimov Jasur Anvarovich',
    status: 'submitted',
    submittedAt: '2026-07-30T10:00:00.000Z',
    lastCheckedAt: '2026-07-30T10:00:00.000Z',
    notifiedStatuses: [],
    ...overrides,
  };
}

describe('MemoryOrgApplicationStore', () => {
  let store: MemoryOrgApplicationStore;

  beforeEach(() => {
    store = new MemoryOrgApplicationStore();
  });

  it('saves and reads back a record', async () => {
    await store.save(record());
    const found = await store.findById('app-1');
    expect(found?.organizationName).toBe('Toshkent moliya instituti');
  });

  it('returns a copy, so a caller cannot mutate stored state', async () => {
    await store.save(record());
    const found = await store.findById('app-1');
    found!.organizationName = 'hacked';
    expect((await store.findById('app-1'))!.organizationName).toBe(
      'Toshkent moliya instituti',
    );
  });

  it('lists one applicant\'s applications newest first', async () => {
    await store.save(record({ applicationId: 'a', submittedAt: '2026-07-01T00:00:00.000Z' }));
    await store.save(record({ applicationId: 'b', submittedAt: '2026-07-20T00:00:00.000Z' }));
    await store.save(record({ applicationId: 'c', contactTelegramId: 999 }));

    const list = await store.listByTelegramId(500);
    expect(list.map((r) => r.applicationId)).toEqual(['b', 'a']);
  });

  it('lists only non-terminal applications as open', async () => {
    await store.save(record({ applicationId: 'open-1', status: 'submitted' }));
    await store.save(record({ applicationId: 'open-2', status: 'ready_for_owner' }));
    await store.save(record({ applicationId: 'open-3', status: 'owner_approved' }));
    // Correctable, so still open — the applicant may yet fix and resume these.
    await store.save(record({ applicationId: 'open-4', status: 'system_verify_blocked' }));
    await store.save(record({ applicationId: 'open-5', status: 'return_for_correction' }));
    await store.save(record({ applicationId: 'done-1', status: 'activated' }));
    await store.save(record({ applicationId: 'done-2', status: 'owner_rejected' }));
    await store.save(record({ applicationId: 'done-3', status: 'platform_admin_rejected' }));
    await store.save(record({ applicationId: 'done-4', status: 'archived' }));

    const open = await store.listOpen();
    expect(open.map((r) => r.applicationId).sort()).toEqual([
      'open-1',
      'open-2',
      'open-3',
      'open-4',
      'open-5',
    ]);
  });

  it('applies a status patch', async () => {
    await store.save(record());
    const updated = await store.applyStatus('app-1', {
      status: 'activated',
      organizationId: 'org-9',
      lastCheckedAt: '2026-07-31T00:00:00.000Z',
    });

    expect(updated?.status).toBe('activated');
    expect(updated?.organizationId).toBe('org-9');
    expect(updated?.lastCheckedAt).toBe('2026-07-31T00:00:00.000Z');
  });

  it('does not erase a rejection reason on a later patch that omits it', async () => {
    await store.save(record());
    await store.applyStatus('app-1', {
      status: 'platform_admin_rejected',
      rejectionReason: 'Ustav o‘qilmadi',
      lastCheckedAt: '2026-07-30T11:00:00.000Z',
    });
    await store.applyStatus('app-1', {
      status: 'platform_admin_rejected',
      lastCheckedAt: '2026-07-30T12:00:00.000Z',
    });

    expect((await store.findById('app-1'))!.rejectionReason).toBe('Ustav o‘qilmadi');
  });

  it('returns null when patching an unknown application', async () => {
    expect(
      await store.applyStatus('nope', { status: 'activated', lastCheckedAt: 'x' }),
    ).toBeNull();
  });

  it('marks a status notified exactly once', async () => {
    await store.save(record());
    expect(await store.markNotified('app-1', 'in_review')).toBe(true);
    expect(await store.markNotified('app-1', 'in_review')).toBe(false);
    expect(await store.markNotified('app-1', 'activated')).toBe(true);
  });

  it('reports false when marking an unknown application', async () => {
    expect(await store.markNotified('nope', 'activated')).toBe(false);
  });
});

describe('JsonOrgApplicationStore', () => {
  let dir: string;
  let filePath: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'orgapp-store-'));
    filePath = path.join(dir, 'organization-applications.json');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('starts empty when the file does not exist yet', async () => {
    const store = new JsonOrgApplicationStore(filePath);
    await store.load();
    expect(await store.countAll()).toBe(0);
  });

  it('creates the directory and persists across instances', async () => {
    const nested = path.join(dir, 'deep', 'data', 'apps.json');
    const first = new JsonOrgApplicationStore(nested);
    await first.load();
    await first.save(record());

    const second = new JsonOrgApplicationStore(nested);
    await second.load();
    expect((await second.findById('app-1'))!.stir).toBe('305447892');
  });

  it('persists status patches and notification marks', async () => {
    const first = new JsonOrgApplicationStore(filePath);
    await first.load();
    await first.save(record());
    await first.applyStatus('app-1', {
      status: 'activated',
      organizationId: 'org-1',
      lastCheckedAt: '2026-08-01T00:00:00.000Z',
    });
    await first.markNotified('app-1', 'activated');

    const second = new JsonOrgApplicationStore(filePath);
    await second.load();
    const reloaded = (await second.findById('app-1'))!;
    expect(reloaded.status).toBe('activated');
    expect(reloaded.organizationId).toBe('org-1');
    expect(reloaded.notifiedStatuses).toEqual(['activated']);
    // A reloaded record must not be re-announced.
    expect(await second.markNotified('app-1', 'activated')).toBe(false);
  });

  it('leaves no temp file behind', async () => {
    const store = new JsonOrgApplicationStore(filePath);
    await store.load();
    await store.save(record());

    const entries = await fs.readdir(dir);
    expect(entries).toEqual(['organization-applications.json']);
  });

  it('survives concurrent writes without corrupting the file', async () => {
    const store = new JsonOrgApplicationStore(filePath);
    await store.load();

    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        store.save(record({ applicationId: `app-${index}` })),
      ),
    );

    const reloaded = new JsonOrgApplicationStore(filePath);
    await reloaded.load();
    expect(await reloaded.countAll()).toBe(25);
  });

  it('skips rows that are missing required fields rather than crashing', async () => {
    await fs.writeFile(
      filePath,
      JSON.stringify([
        record(),
        { applicationId: 'no-telegram-id', status: 'submitted' },
        { contactTelegramId: 5, status: 'submitted' },
        { applicationId: 'bad-status', contactTelegramId: 5, status: 'invented' },
        'not-an-object',
        null,
      ]),
      'utf8',
    );

    const store = new JsonOrgApplicationStore(filePath);
    await store.load();
    expect(await store.countAll()).toBe(1);
    expect(await store.findById('app-1')).not.toBeNull();
  });

  it('drops unknown values out of notifiedStatuses', async () => {
    await fs.writeFile(
      filePath,
      JSON.stringify([record({ notifiedStatuses: ['activated', 'nonsense'] as never })]),
      'utf8',
    );

    const store = new JsonOrgApplicationStore(filePath);
    await store.load();
    expect((await store.findById('app-1'))!.notifiedStatuses).toEqual(['activated']);
  });

  it('refuses to start on a corrupt file instead of silently emptying it', async () => {
    await fs.writeFile(filePath, '{ this is not json', 'utf8');
    const store = new JsonOrgApplicationStore(filePath);
    await expect(store.load()).rejects.toThrow();
  });

  it('refuses a JSON file that is not an array', async () => {
    await fs.writeFile(filePath, JSON.stringify({ applications: [] }), 'utf8');
    const store = new JsonOrgApplicationStore(filePath);
    await expect(store.load()).rejects.toThrow(/array/i);
  });
});
