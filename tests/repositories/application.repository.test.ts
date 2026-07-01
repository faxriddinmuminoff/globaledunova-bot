import { describe, it, expect } from 'vitest';
import {
  createApplication,
  findApplicationsByTelegramId,
  applicationExists,
} from '../../src/database/repositories/application.repository';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('application repository', () => {
  useFreshMemoryStorage();

  it('creates and finds applications', async () => {
    await getOrCreateUser(10001, 'Repo User');
    const app = await createApplication({
      telegram_id: 10001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    const apps = await findApplicationsByTelegramId(10001);
    expect(apps).toHaveLength(1);
    expect(apps[0].id).toBe(app.id);
  });

  it('detects duplicate applications', async () => {
    await getOrCreateUser(10002, 'Dup User');
    await createApplication({
      telegram_id: 10002,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    expect(await applicationExists(10002, 'de-1', 'bachelor')).toBe(true);
    expect(await applicationExists(10002, 'de-2', 'bachelor')).toBe(false);
  });
});
