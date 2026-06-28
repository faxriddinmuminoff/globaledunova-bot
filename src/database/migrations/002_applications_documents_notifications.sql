-- Applications, documents, and notifications persistence

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  university_id VARCHAR(32) NOT NULL,
  country VARCHAR(2) NOT NULL,
  degree VARCHAR(16) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_applications_telegram_id
    FOREIGN KEY (telegram_id) REFERENCES users (telegram_id) ON DELETE CASCADE,
  CONSTRAINT uq_applications_user_university_degree
    UNIQUE (telegram_id, university_id, degree),
  CONSTRAINT chk_applications_country
    CHECK (country IN ('de', 'hu', 'pl', 'it', 'tr')),
  CONSTRAINT chk_applications_degree
    CHECK (degree IN ('bachelor', 'master', 'phd')),
  CONSTRAINT chk_applications_status
    CHECK (status IN (
      'draft', 'submitted', 'reviewing', 'documents_required',
      'sent_to_university', 'accepted', 'rejected', 'visa_processing', 'completed'
    ))
);

CREATE INDEX IF NOT EXISTS idx_applications_telegram_id
  ON applications (telegram_id);

CREATE INDEX IF NOT EXISTS idx_applications_telegram_id_created_at
  ON applications (telegram_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_status
  ON applications (status);

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  application_id BIGINT NOT NULL,
  document_type VARCHAR(32) NOT NULL,
  telegram_file_id VARCHAR(256) NOT NULL,
  original_file_name VARCHAR(512) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  CONSTRAINT fk_documents_application_id
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_telegram_id
    FOREIGN KEY (telegram_id) REFERENCES users (telegram_id) ON DELETE CASCADE,
  CONSTRAINT uq_documents_app_user_type
    UNIQUE (application_id, telegram_id, document_type),
  CONSTRAINT chk_documents_document_type
    CHECK (document_type IN (
      'passport', 'diploma', 'transcript', 'ielts', 'motivation_letter', 'photo'
    )),
  CONSTRAINT chk_documents_status
    CHECK (status IN ('pending', 'verified', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_documents_telegram_id
  ON documents (telegram_id);

CREATE INDEX IF NOT EXISTS idx_documents_telegram_id_uploaded_at
  ON documents (telegram_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_application_id
  ON documents (application_id);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  application_id BIGINT,
  CONSTRAINT fk_notifications_user_id
    FOREIGN KEY (user_id) REFERENCES users (telegram_id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_application_id
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE SET NULL
);

COMMENT ON COLUMN notifications.user_id IS 'Telegram user ID (matches users.telegram_id, not users.id)';

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread
  ON notifications (user_id)
  WHERE is_read = FALSE;
