import { describe, it, expect } from 'vitest';
import {
  buildAuditMetadata,
  logAdminAudit,
  statusToAuditAction,
} from '../../src/audit/audit-admin.service';
import { getRecentAuditLogs } from '../../src/audit/audit.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('audit-admin service', () => {
  useFreshMemoryStorage();

  it('builds metadata with actor and timestamp', () => {
    const meta = buildAuditMetadata(123, { applicationId: 5, newValue: 'accepted' });
    expect(meta.actorTelegramId).toBe(123);
    expect(meta.applicationId).toBe(5);
    expect(meta.timestamp).toBeTruthy();
  });

  it('maps status to audit actions', () => {
    expect(statusToAuditAction('accepted')).toBe('application_accept');
    expect(statusToAuditAction('rejected')).toBe('application_reject');
    expect(statusToAuditAction('documents_required')).toBe('documents_requested');
    expect(statusToAuditAction('reviewing')).toBe('application_status_change');
  });

  it('persists admin audit logs in memory', async () => {
    await logAdminAudit({
      adminId: 999,
      action: 'admin_login',
      entityType: 'admin',
      metadata: { targetTelegramId: 111 },
    });

    const logs = await getRecentAuditLogs(5);
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('admin_login');
    expect(logs[0].metadata?.actorTelegramId).toBe(999);
  });
});
