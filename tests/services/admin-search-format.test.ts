import { describe, it, expect, beforeEach } from 'vitest';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import {
  executeAdminSearch,
  formatApplicationSearchResults,
} from '../../src/services/admin-search.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('admin search formatters', () => {
  useFreshMemoryStorage();

  beforeEach(async () => {
    await getOrCreateUser(20001, 'App Search');
    await createApplication({
      telegram_id: 20001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'accepted',
    });
  });

  it('formats application search results', async () => {
    const result = await executeAdminSearch('status', 'accepted', 1);
    const text = await formatApplicationSearchResults('en', result.items, result);
    expect(text).toContain('App Search');
    expect(text).toContain('Page');
  });
});
