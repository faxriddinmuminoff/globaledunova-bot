import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS } from '../../src/rbac/types';

describe('RBAC permissions', () => {
  it('super_admin has all permissions', () => {
    expect(ROLE_PERMISSIONS.super_admin).toContain('settings:update');
    expect(ROLE_PERMISSIONS.super_admin).toContain('broadcast:send');
    expect(ROLE_PERMISSIONS.super_admin).toContain('universities:manage');
  });

  it('reviewer cannot update applications or verify documents', () => {
    expect(ROLE_PERMISSIONS.reviewer).not.toContain('applications:update');
    expect(ROLE_PERMISSIONS.reviewer).not.toContain('documents:verify');
  });

  it('support has limited access', () => {
    expect(ROLE_PERMISSIONS.support).toContain('applications:view');
    expect(ROLE_PERMISSIONS.support).not.toContain('documents:verify');
  });
});
