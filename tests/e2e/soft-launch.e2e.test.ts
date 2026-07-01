import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetTestEnvironment } from '../helpers/test-storage';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { setSetting } from '../../src/settings/settings.service';

vi.mock('../../src/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/config')>();
  return {
    ...actual,
    isSoftLaunchMode: true,
    softLaunchWhitelist: [32001],
    config: {
      ...actual.config,
      SOFT_LAUNCH_MODE: true,
      SOFT_LAUNCH_MAX_APPLICATIONS: 1,
      SOFT_LAUNCH_TEST_NOTIFICATIONS: true,
    },
  };
});

describe('E2E Telegram flow 12. soft launch restrictions', () => {
  beforeEach(async () => {
    await resetTestEnvironment();
  });

  it('allows only whitelisted students', async () => {
    const { isStudentWhitelisted } = await import('../../src/services/soft-launch.service');
    expect(await isStudentWhitelisted(32001)).toBe(true);
    expect(await isStudentWhitelisted(32002)).toBe(false);
  });

  it('enforces max applications', async () => {
    const { canStudentApply } = await import('../../src/services/soft-launch.service');
    await getOrCreateUser(32001, 'Soft Launch');
    await createApplication({
      telegram_id: 32001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    const result = await canStudentApply(32001);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('soft_launch_max_applications');
  });

  it('filters demo universities', async () => {
    const { filterUniversitiesForSoftLaunch } = await import('../../src/services/soft-launch.service');
    await setSetting('demo_university_ids', ['de-1'], 1);
    const result = await filterUniversitiesForSoftLaunch([
      { id: 'de-1', name: 'Demo' },
      { id: 'de-2', name: 'Hidden' },
    ]);
    expect(result).toEqual([{ id: 'de-1', name: 'Demo' }]);
  });
});
