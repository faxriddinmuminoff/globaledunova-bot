import { SettingKey } from '../settings/types';
import { getSetting, setSetting } from '../settings/settings.service';
import { logAdminAudit } from '../audit/audit-admin.service';

export async function getSettingsOverview(): Promise<Record<string, unknown>> {
  const keys: SettingKey[] = [
    'manager_username',
    'reminder_intervals',
    'default_storage_provider',
    'notifications_enabled',
    'reminder_enabled',
    'maintenance_mode',
    'demo_university_ids',
  ];

  const overview: Record<string, unknown> = {};
  for (const key of keys) {
    overview[key] = await getSetting(key);
  }
  return overview;
}

export async function updateSettingWithAudit(
  key: SettingKey,
  value: unknown,
  adminId: number,
): Promise<void> {
  const previousValue = await getSetting(key);
  await setSetting(key, value, adminId);
  await logAdminAudit({
    adminId,
    action: 'settings_changed',
    entityType: 'setting',
    metadata: {
      previousValue,
      newValue: value,
      settingKey: key,
    },
  });
}

export async function toggleBooleanSetting(
  key: 'maintenance_mode' | 'notifications_enabled' | 'reminder_enabled',
  adminId: number,
): Promise<boolean> {
  const current = Boolean(await getSetting<boolean>(key));
  const next = !current;
  await updateSettingWithAudit(key, next, adminId);
  return next;
}
