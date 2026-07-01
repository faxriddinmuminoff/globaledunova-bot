-- Phase 4: Enterprise — storage, queue, audit, RBAC, settings, universities, broadcasts

-- Document storage metadata
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(32) NOT NULL DEFAULT 'telegram';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_key VARCHAR(512);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(128);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents (application_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_university_id ON applications (university_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone_number);

-- Countries (DB-driven)
CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(8) PRIMARY KEY,
  names JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Degree types (DB-driven)
CREATE TABLE IF NOT EXISTS degree_types (
  code VARCHAR(16) PRIMARY KEY,
  names JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Universities (DB-driven, replaces static catalog)
CREATE TABLE IF NOT EXISTS universities (
  id VARCHAR(32) PRIMARY KEY,
  country_code VARCHAR(8) NOT NULL REFERENCES countries (code),
  names JSONB NOT NULL,
  supported_degrees TEXT[] NOT NULL DEFAULT ARRAY['bachelor','master','phd'],
  logo_storage_key VARCHAR(512),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_universities_country ON universities (country_code);
CREATE INDEX IF NOT EXISTS idx_universities_archived ON universities (is_archived);

-- Admin RBAC
CREATE TABLE IF NOT EXISTS admin_users (
  telegram_id BIGINT PRIMARY KEY,
  role VARCHAR(32) NOT NULL DEFAULT 'reviewer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_admin_users_role
    CHECK (role IN ('super_admin', 'manager', 'reviewer', 'support'))
);

-- App settings (DB-driven)
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by BIGINT
);

-- Audit logs (admin actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(32),
  entity_id BIGINT,
  metadata JSONB,
  ip VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Job queue
CREATE TABLE IF NOT EXISTS job_queue (
  id BIGSERIAL PRIMARY KEY,
  job_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_job_queue_status
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead'))
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled
  ON job_queue (status, scheduled_at)
  WHERE status IN ('pending', 'processing');

-- Dead letter queue
CREATE TABLE IF NOT EXISTS dead_letter_jobs (
  id BIGSERIAL PRIMARY KEY,
  original_job_id BIGINT,
  job_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  last_error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backup records
CREATE TABLE IF NOT EXISTS backup_records (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(512) NOT NULL,
  file_path VARCHAR(1024),
  file_size BIGINT,
  status VARCHAR(32) NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_backup_records_status CHECK (status IN ('success', 'failed', 'running'))
);

CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records (created_at DESC);

-- Broadcast campaigns
CREATE TABLE IF NOT EXISTS broadcast_campaigns (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  message TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_count INT NOT NULL DEFAULT 0,
  total_targets INT NOT NULL DEFAULT 0,
  created_by BIGINT NOT NULL,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_broadcast_status
    CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_status ON broadcast_campaigns (status);

-- Seed countries
INSERT INTO countries (code, names, sort_order) VALUES
  ('de', '{"en":"Germany","ru":"Германия","uz":"Germaniya"}', 1),
  ('hu', '{"en":"Hungary","ru":"Венгрия","uz":"Vengriya"}', 2),
  ('pl', '{"en":"Poland","ru":"Польша","uz":"Polsha"}', 3),
  ('it', '{"en":"Italy","ru":"Италия","uz":"Italiya"}', 4),
  ('tr', '{"en":"Turkey","ru":"Турция","uz":"Turkiya"}', 5)
ON CONFLICT (code) DO NOTHING;

-- Seed degree types
INSERT INTO degree_types (code, names, sort_order) VALUES
  ('bachelor', '{"en":"Bachelor","ru":"Бакалавр","uz":"Bakalavr"}', 1),
  ('master', '{"en":"Master","ru":"Магистр","uz":"Magistr"}', 2),
  ('phd', '{"en":"PhD","ru":"Докторант","uz":"PhD"}', 3)
ON CONFLICT (code) DO NOTHING;

-- Seed universities (from legacy catalog)
INSERT INTO universities (id, country_code, names, sort_order) VALUES
  ('de-1', 'de', '{"en":{"name":"Technical University of Munich","city":"Munich"},"ru":{"name":"Технический университет Мюнхена","city":"Мюнхен"},"uz":{"name":"Myunxen texnika universiteti","city":"Myunxen"}}', 1),
  ('de-2', 'de', '{"en":{"name":"Heidelberg University","city":"Heidelberg"},"ru":{"name":"Гейдельбергский университет","city":"Гейдельберг"},"uz":{"name":"Haydelberg universiteti","city":"Haydelberg"}}', 2),
  ('de-3', 'de', '{"en":{"name":"Humboldt University of Berlin","city":"Berlin"},"ru":{"name":"Гумбoldtский университет Берлина","city":"Берлин"},"uz":{"name":"Berlin Humboldt universiteti","city":"Berlin"}}', 3),
  ('hu-1', 'hu', '{"en":{"name":"Eötvös Loránd University","city":"Budapest"},"ru":{"name":"Будапештский университет Эötvös Loránd","city":"Будапешт"},"uz":{"name":"Eötvös Loránd Budapesht universiteti","city":"Budapesht"}}', 1),
  ('hu-2', 'hu', '{"en":{"name":"Budapest University of Technology","city":"Budapest"},"ru":{"name":"Будапештский технологический университет","city":"Будапешт"},"uz":{"name":"Budapesht texnologiya universiteti","city":"Budapesht"}}', 2),
  ('hu-3', 'hu', '{"en":{"name":"University of Szeged","city":"Szeged"},"ru":{"name":"Университет Сегеда","city":"Сегед"},"uz":{"name":"Seged universiteti","city":"Seged"}}', 3),
  ('pl-1', 'pl', '{"en":{"name":"University of Warsaw","city":"Warsaw"},"ru":{"name":"Варшавский университет","city":"Варшава"},"uz":{"name":"Varshava universiteti","city":"Varshava"}}', 1),
  ('pl-2', 'pl', '{"en":{"name":"Jagiellonian University","city":"Kraków"},"ru":{"name":"Ягеллонский университет","city":"Краков"},"uz":{"name":"Yagellon universiteti","city":"Krakov"}}', 2),
  ('pl-3', 'pl', '{"en":{"name":"Warsaw University of Technology","city":"Warsaw"},"ru":{"name":"Варшавский технологический университет","city":"Варшава"},"uz":{"name":"Varshava texnologiya universiteti","city":"Varshava"}}', 3),
  ('it-1', 'it', '{"en":{"name":"University of Bologna","city":"Bologna"},"ru":{"name":"Болонский университет","city":"Болонья"},"uz":{"name":"Bologna universiteti","city":"Bologna"}}', 1),
  ('it-2', 'it', '{"en":{"name":"Sapienza University of Rome","city":"Rome"},"ru":{"name":"Университет Сапиенца","city":"Рим"},"uz":{"name":"Sapienza Rim universiteti","city":"Rim"}}', 2),
  ('it-3', 'it', '{"en":{"name":"Politecnico di Milano","city":"Milan"},"ru":{"name":"Политехнический университет Милана","city":"Милан"},"uz":{"name":"Milano politexnika universiteti","city":"Milan"}}', 3),
  ('tr-1', 'tr', '{"en":{"name":"Boğaziçi University","city":"Istanbul"},"ru":{"name":"Богазичский университет","city":"Стамбул"},"uz":{"name":"Boğaziçi universiteti","city":"Istanbul"}}', 1),
  ('tr-2', 'tr', '{"en":{"name":"Middle East Technical University","city":"Ankara"},"ru":{"name":"Ближневосточный технический университет","city":"Анкара"},"uz":{"name":"O''rta Sharq texnika universiteti","city":"Ankara"}}', 2),
  ('tr-3', 'tr', '{"en":{"name":"Istanbul University","city":"Istanbul"},"ru":{"name":"Стамбульский университет","city":"Стамбул"},"uz":{"name":"Istanbul universiteti","city":"Istanbul"}}', 3)
ON CONFLICT (id) DO NOTHING;

-- Default app settings
INSERT INTO app_settings (key, value) VALUES
  ('bot_name', '"GlobalEduNova"'),
  ('support_username', '""'),
  ('maintenance_mode', 'false'),
  ('reminder_enabled', 'true'),
  ('notifications_enabled', 'true'),
  ('max_upload_size', '20971520'),
  ('allowed_mime_types', '["application/pdf","image/jpeg","image/png","image/webp"]')
ON CONFLICT (key) DO NOTHING;
