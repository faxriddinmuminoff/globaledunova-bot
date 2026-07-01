import { describe, it, expect } from 'vitest';
import {
  saveUniversityWizard,
  deactivateUniversity,
  listManageableUniversities,
} from '../../src/services/admin-university.service';
import { getRecentAuditLogs } from '../../src/audit/audit.service';
import { getUniversityStore } from '../../src/database/storage';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('admin university service', () => {
  useFreshMemoryStorage();

  it('creates university via wizard', async () => {
    const saved = await saveUniversityWizard(
      {
        countryCode: 'de',
        supportedDegrees: ['bachelor'],
        names: {
          en: { name: 'Test Uni EN', city: 'Berlin' },
          ru: { name: 'Test Uni RU', city: 'Berlin' },
          uz: { name: 'Test Uni UZ', city: 'Berlin' },
        },
        requirements: { passport: true, diploma: true },
      },
      6001,
    );

    expect(saved.id).toBeTruthy();
    const record = await getUniversityStore().findById(saved.id);
    expect(record?.names.en.name).toBe('Test Uni EN');

    const logs = await getRecentAuditLogs(5);
    expect(logs.some((l) => l.action === 'university_created')).toBe(true);
  });

  it('deactivates university with audit', async () => {
    const saved = await saveUniversityWizard(
      {
        countryCode: 'fr',
        supportedDegrees: ['master'],
        names: {
          en: { name: 'Paris Uni', city: 'Paris' },
          ru: { name: 'Paris Uni', city: 'Paris' },
          uz: { name: 'Paris Uni', city: 'Paris' },
        },
        requirements: { passport: true },
      },
      6001,
    );

    const ok = await deactivateUniversity(saved.id, 6001);
    expect(ok).toBe(true);

    const logs = await getRecentAuditLogs(10);
    expect(logs.some((l) => l.action === 'university_deleted')).toBe(true);
  });

  it('lists manageable universities', async () => {
    const list = await listManageableUniversities();
    expect(list.length).toBeGreaterThan(0);
  });
});
