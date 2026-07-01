import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApplication } from '../../src/database/repositories/application.repository';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { setSetting } from '../../src/settings/settings.service';
import { resetTestEnvironment } from '../helpers/test-storage';

vi.mock('../../src/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/config')>();
  return {
    ...actual,
    isSoftLaunchMode: true,
    softLaunchWhitelist: [5001, 5002],
    config: {
      ...actual.config,
      SOFT_LAUNCH_MODE: true,
      SOFT_LAUNCH_MAX_APPLICATIONS: 1,
      SOFT_LAUNCH_TEST_NOTIFICATIONS: true,
    },
  };
});

describe('soft launch service', () => {
  beforeEach(async () => {
    await resetTestEnvironment();
  });

  it('blocks non-whitelisted students', async () => {
    const { isStudentWhitelisted } = await import('../../src/services/soft-launch.service');
    expect(await isStudentWhitelisted(5001)).toBe(true);
    expect(await isStudentWhitelisted(9999)).toBe(false);
  });

  it('limits applications per student', async () => {
    const { canStudentApply } = await import('../../src/services/soft-launch.service');
    await getOrCreateUser(5001, 'Whitelisted');
    await createApplication({
      telegram_id: 5001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    const check = await canStudentApply(5001);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('soft_launch_max_applications');
  });

  it('filters demo universities', async () => {
    await setSetting('demo_university_ids', ['de-1'], 1);
    const { filterUniversitiesForSoftLaunch } = await import(
      '../../src/services/soft-launch.service'
    );
    const filtered = await filterUniversitiesForSoftLaunch([
      { id: 'de-1', name: 'A' },
      { id: 'de-2', name: 'B' },
    ]);
    expect(filtered.map((u) => u.id)).toEqual(['de-1']);
  });
});
