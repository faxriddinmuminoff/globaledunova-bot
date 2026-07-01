-- Rollback Phase 4 (partial — data tables dropped, document columns retained nullable)

DROP TABLE IF EXISTS broadcast_campaigns;
DROP TABLE IF EXISTS backup_records;
DROP TABLE IF EXISTS dead_letter_jobs;
DROP TABLE IF EXISTS job_queue;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS universities;
DROP TABLE IF EXISTS degree_types;
DROP TABLE IF EXISTS countries;

ALTER TABLE documents DROP COLUMN IF EXISTS checksum;
ALTER TABLE documents DROP COLUMN IF EXISTS mime_type;
ALTER TABLE documents DROP COLUMN IF EXISTS file_size;
ALTER TABLE documents DROP COLUMN IF EXISTS storage_url;
ALTER TABLE documents DROP COLUMN IF EXISTS storage_key;
ALTER TABLE documents DROP COLUMN IF EXISTS storage_provider;
