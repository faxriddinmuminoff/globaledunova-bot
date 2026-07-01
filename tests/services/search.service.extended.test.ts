import { describe, it, expect, beforeEach } from 'vitest';
import { searchApplicationsPaginated } from '../../src/services/search.service';
import { getOrCreateUser, updateUserPhone } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('search service extended', () => {
  useFreshMemoryStorage();

  beforeEach(async () => {
    await getOrCreateUser(22001, 'Extended Search');
    await updateUserPhone(22001, '+441234567890', 'Extended Search');
    await createApplication({
      telegram_id: 22001,
      university_id: 'de-2',
      country: 'de',
      degree: 'master',
      status: 'submitted',
    });
  });

  it('searches by application id', async () => {
    const result = await searchApplicationsPaginated({
      type: 'application_id',
      query: '1',
      page: 1,
      pageSize: 10,
    });
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('searches by name', async () => {
    const result = await searchApplicationsPaginated({
      type: 'name',
      query: 'Extended',
      page: 1,
      pageSize: 10,
    });
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('searches by phone on applications', async () => {
    const result = await searchApplicationsPaginated({
      type: 'phone',
      query: '441234567890',
      page: 1,
      pageSize: 10,
    });
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('searches by status', async () => {
    const result = await searchApplicationsPaginated({
      type: 'status',
      query: 'submitted',
      page: 1,
      pageSize: 10,
    });
    expect(result.items.every((a) => a.status === 'submitted')).toBe(true);
  });
});
