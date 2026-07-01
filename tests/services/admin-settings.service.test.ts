import { describe, it, expect } from 'vitest';
import {
  getSettingsOverview,
  toggleBooleanSetting,
  updateSettingWithAudit,
} from '../../src/services/admin-settings.service';
import { getRecentAuditLogs } from '../../src/audit/audit.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('admin settings service', () => {
  useFreshMemoryStorage();

  it('returns settings overview', async () => {
    const overview = await getSettingsOverview();
    expect(overview).toHaveProperty('manager_username');
    expect(overview).toHaveProperty('maintenance_mode');
  });

  it('updates setting with audit trail', async () => {
    await updateSettingWithAudit('manager_username', '@newmanager', 7001);
    const overview = await getSettingsOverview();
    expect(overview.manager_username).toBe('@newmanager');

    const logs = await getRecentAuditLogs(5);
    expect(logs.some((l) => l.action === 'settings_changed')).toBe(true);
  });

  it('toggles boolean settings', async () => {
    const next = await toggleBooleanSetting('maintenance_mode', 7001);
    expect(typeof next).toBe('boolean');
  });
});
