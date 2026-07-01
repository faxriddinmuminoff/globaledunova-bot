export type SettingKey =
  | 'bot_name'
  | 'support_username'
  | 'manager_username'
  | 'maintenance_mode'
  | 'reminder_enabled'
  | 'notifications_enabled'
  | 'max_upload_size'
  | 'allowed_mime_types'
  | 'reminder_intervals'
  | 'default_storage_provider'
  | 'demo_university_ids';

export interface AppSetting {
  key: SettingKey;
  value: unknown;
  updated_at: Date;
  updated_by: number | null;
}

export const DEFAULT_SETTINGS: Record<SettingKey, unknown> = {
  bot_name: 'GlobalEduNova',
  support_username: '',
  manager_username: '',
  maintenance_mode: false,
  reminder_enabled: true,
  notifications_enabled: true,
  max_upload_size: 20 * 1024 * 1024,
  allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  reminder_intervals: [3, 7, 14],
  default_storage_provider: 'telegram',
  demo_university_ids: [],
};
