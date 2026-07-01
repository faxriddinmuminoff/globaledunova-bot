import { describe, it, expect, beforeEach } from 'vitest';
import { getOrCreateUser, updateUserPhone } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import {
  executeAdminSearch,
  formatUserSearchResults,
  isUserSearchMode,
  ADMIN_SEARCH_PAGE_SIZE,
} from '../../src/services/admin-search.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('admin search service', () => {
  useFreshMemoryStorage();

  beforeEach(async () => {
    await getOrCreateUser(4001, 'Alice Search');
    await updateUserPhone(4001, '+998901234567', 'Alice Search');
    await createApplication({
      telegram_id: 4001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'reviewing',
    });
  });

  it('identifies user search modes', () => {
    expect(isUserSearchMode('phone')).toBe(true);
    expect(isUserSearchMode('status')).toBe(false);
  });

  it('searches users by name with pagination', async () => {
    const result = await executeAdminSearch('name', 'Alice', 1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.pageSize).toBe(ADMIN_SEARCH_PAGE_SIZE);
    expect(formatUserSearchResults('en', result.items, result)).toContain('Alice');
  });

  it('searches applications by status', async () => {
    const result = await executeAdminSearch('status', 'reviewing', 1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.items[0].status).toBe('reviewing');
  });

  it('searches by telegram id', async () => {
    const result = await executeAdminSearch('telegram_id', '4001', 1);
    expect(result.total).toBe(1);
  });
});
