import { describe, it, expect } from 'vitest';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import {
  adminChangeApplicationStatus,
  isAdminUpdatableStatus,
} from '../../src/services/admin-application.service';
import { getRecentAuditLogs } from '../../src/audit/audit.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('admin application service', () => {
  useFreshMemoryStorage();

  it('validates admin updatable statuses', () => {
    expect(isAdminUpdatableStatus('accepted')).toBe(true);
    expect(isAdminUpdatableStatus('invalid')).toBe(false);
  });

  it('changes status and writes audit log', async () => {
    await getOrCreateUser(2001, 'Applicant');
    const app = await createApplication({
      telegram_id: 2001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'reviewing',
    });

    const result = await adminChangeApplicationStatus(app.id, 'accepted', 9001);
    expect(result.success).toBe(true);
    expect(result.previousStatus).toBe('reviewing');

    const logs = await getRecentAuditLogs(5);
    expect(logs.some((l) => l.action === 'application_accept')).toBe(true);
  });

  it('returns false for missing application', async () => {
    const result = await adminChangeApplicationStatus(99999, 'accepted', 9001);
    expect(result.success).toBe(false);
  });
});
