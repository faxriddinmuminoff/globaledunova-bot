-- Phase 5: extended settings defaults

INSERT INTO app_settings (key, value) VALUES
  ('manager_username', '""'),
  ('reminder_intervals', '[3,7,14]'),
  ('default_storage_provider', '"telegram"'),
  ('notifications_enabled', 'true'),
  ('reminder_enabled', 'true'),
  ('maintenance_mode', 'false'),
  ('demo_university_ids', '[]')
ON CONFLICT (key) DO NOTHING;
