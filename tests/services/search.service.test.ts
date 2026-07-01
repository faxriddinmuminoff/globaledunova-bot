import { describe, it, expect, beforeEach } from 'vitest';
import {
  searchUsersPaginated,
  searchApplicationsPaginated,
} from '../../src/services/search.service';
import { getOrCreateUser, updateUserPhone } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('search service', () => {
  useFreshMemoryStorage();

  beforeEach(async () => {
    await getOrCreateUser(8001, 'Search Me');
    await updateUserPhone(8001, '+49123456789', 'Search Me');
    await createApplication({
      telegram_id: 8001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'submitted',
    });
  });

  it('paginates user search by phone', async () => {
    const result = await searchUsersPaginated('phone', '49123456789', 1, 10);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.items[0].telegram_id).toBe(8001);
  });

  it('paginates application search by university', async () => {
    const result = await searchApplicationsPaginated({
      type: 'university',
      query: 'de-1',
      page: 1,
      pageSize: 10,
    });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.items[0].university_id).toBe('de-1');
  });
});
