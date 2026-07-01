import { describe, it, expect } from 'vitest';
import { upsertAdminUser, hasPermission, clearMemoryAdminsForTests } from '../../src/rbac/rbac.service';
import { useFreshMemoryStorage, resetTestEnvironment } from '../helpers/test-storage';

describe('rbac service', () => {
  useFreshMemoryStorage();

  it('grants permissions by role', async () => {
    clearMemoryAdminsForTests();
    await upsertAdminUser(14001, 'reviewer');
    expect(await hasPermission(14001, 'documents:verify')).toBe(false);
    expect(await hasPermission(14001, 'settings:update')).toBe(false);
  });

  it('denies unknown users', async () => {
    await resetTestEnvironment();
    expect(await hasPermission(99999, 'applications:view')).toBe(false);
  });
});
