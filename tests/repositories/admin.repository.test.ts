import { describe, it, expect } from 'vitest';
import {
  validateWizardDraft,
  buildUniversityId,
} from '../../src/services/admin-university.service';
import {
  getAdminStatistics,
  findApplicationWithStudentById,
} from '../../src/database/repositories/admin.repository';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('admin repository', () => {
  useFreshMemoryStorage();

  it('returns admin statistics', async () => {
    await getOrCreateUser(18001, 'Admin Stat');
    await createApplication({
      telegram_id: 18001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    const stats = await getAdminStatistics();
    expect(stats.totalApplications).toBeGreaterThanOrEqual(1);
  });

  it('finds application with student', async () => {
    await getOrCreateUser(18002, 'Enriched');
    const app = await createApplication({
      telegram_id: 18002,
      university_id: 'de-1',
      country: 'de',
      degree: 'master',
    });

    const enriched = await findApplicationWithStudentById(app.id);
    expect(enriched?.student_name).toBe('Enriched');
  });
});

describe('university wizard helpers', () => {
  it('validates wizard draft', () => {
    expect(validateWizardDraft({})).toBe('country_required');
    expect(
      validateWizardDraft({
        countryCode: 'de',
        supportedDegrees: ['bachelor'],
        names: { en: { name: 'Uni', city: 'Berlin' } },
      }),
    ).toBeNull();
  });

  it('builds university id slug', () => {
    expect(buildUniversityId('de', 'Test University')).toMatch(/^de-test-university/);
  });
});
