import { describe, it, expect } from 'vitest';
import {
  upsertAdminUser,
  hasPermission,
  isAdminUser,
  isAdminSync,
  clearMemoryAdminsForTests,
} from '../../src/rbac/rbac.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('rbac service extended', () => {
  useFreshMemoryStorage();

  it('upserts admin and checks sync cache', async () => {
    clearMemoryAdminsForTests();
    await upsertAdminUser(21001, 'support');
    expect(isAdminSync(21001)).toBe(true);
    expect(await isAdminUser(21001)).toBe(true);
  });

  it('grants support permissions', async () => {
    clearMemoryAdminsForTests();
    await upsertAdminUser(21002, 'support');
    expect(await hasPermission(21002, 'applications:view')).toBe(true);
    expect(await hasPermission(21002, 'broadcast:send')).toBe(false);
  });

  it('grants manager broadcast permission', async () => {
    clearMemoryAdminsForTests();
    await upsertAdminUser(21003, 'manager');
    expect(await hasPermission(21003, 'broadcast:send')).toBe(true);
  });
});
