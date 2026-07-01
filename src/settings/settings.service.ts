import { getStorageBackend } from '../database/storage';
import { query, queryOne } from '../database/index';
import { AppSetting, DEFAULT_SETTINGS, SettingKey } from './types';

interface SettingRow {
  key: string;
  value: unknown;
  updated_at: Date;
  updated_by: string | null;
}

const memorySettings = new Map<string, AppSetting>();

function initMemoryDefaults(): void {
  if (memorySettings.size > 0) return;
  const now = new Date();
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    memorySettings.set(key, {
      key: key as SettingKey,
      value,
      updated_at: now,
      updated_by: null,
    });
  }
}

export async function getSetting<T = unknown>(key: SettingKey): Promise<T> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<SettingRow>(
      `SELECT * FROM app_settings WHERE key = $1`,
      [key],
    );
    if (!row) return DEFAULT_SETTINGS[key] as T;
    return row.value as T;
  }

  initMemoryDefaults();
  return (memorySettings.get(key)?.value ?? DEFAULT_SETTINGS[key]) as T;
}

export async function getAllSettings(): Promise<AppSetting[]> {
  if (getStorageBackend() === 'postgres') {
    const rows = await query<SettingRow>(`SELECT * FROM app_settings ORDER BY key`);
    return rows.map((row) => ({
      key: row.key as SettingKey,
      value: row.value,
      updated_at: row.updated_at,
      updated_by: row.updated_by ? Number(row.updated_by) : null,
    }));
  }

  initMemoryDefaults();
  return [...memorySettings.values()].map((s) => ({ ...s }));
}

export async function setSetting(
  key: SettingKey,
  value: unknown,
  updatedBy?: number,
): Promise<AppSetting> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<SettingRow>(
      `INSERT INTO app_settings (key, value, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value), updatedBy ?? null],
    );
    if (!row) throw new Error('Failed to set setting');
    return {
      key: row.key as SettingKey,
      value: row.value,
      updated_at: row.updated_at,
      updated_by: row.updated_by ? Number(row.updated_by) : null,
    };
  }

  initMemoryDefaults();
  const setting: AppSetting = {
    key,
    value,
    updated_at: new Date(),
    updated_by: updatedBy ?? null,
  };
  memorySettings.set(key, setting);
  return { ...setting };
}

export async function isMaintenanceMode(): Promise<boolean> {
  return Boolean(await getSetting<boolean>('maintenance_mode'));
}

export function clearMemorySettingsForTests(): void {
  memorySettings.clear();
}
