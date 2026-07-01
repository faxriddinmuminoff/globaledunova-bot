-- Phase 3: application timeline, activity logs, university requirements

-- Expand application status values
ALTER TABLE applications DROP CONSTRAINT IF EXISTS chk_applications_status;

ALTER TABLE applications ADD CONSTRAINT chk_applications_status
  CHECK (status IN (
    'draft', 'submitted', 'reviewing', 'documents_required', 'documents_completed',
    'sent_to_university', 'accepted', 'rejected', 'visa_processing', 'visa_approved',
    'enrolled', 'completed'
  ));

CREATE TABLE IF NOT EXISTS application_events (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  telegram_id BIGINT NOT NULL,
  event_type VARCHAR(32) NOT NULL DEFAULT 'status_change',
  from_status VARCHAR(32),
  to_status VARCHAR(32),
  changed_by BIGINT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_application_events_application_id
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT fk_application_events_telegram_id
    FOREIGN KEY (telegram_id) REFERENCES users (telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_application_events_application_id
  ON application_events (application_id);

CREATE INDEX IF NOT EXISTS idx_application_events_telegram_id
  ON application_events (telegram_id);

CREATE INDEX IF NOT EXISTS idx_application_events_created_at
  ON application_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_events_application_id_created_at
  ON application_events (application_id, created_at DESC);

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT,
  actor_telegram_id BIGINT,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(32),
  entity_id BIGINT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_telegram_id
  ON activity_logs (telegram_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_telegram_id
  ON activity_logs (actor_telegram_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action
  ON activity_logs (action);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON activity_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS university_requirements (
  id BIGSERIAL PRIMARY KEY,
  university_id VARCHAR(32) NOT NULL,
  document_type VARCHAR(32) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_university_requirements_uni_doc
    UNIQUE (university_id, document_type),
  CONSTRAINT chk_university_requirements_document_type
    CHECK (document_type IN (
      'passport', 'diploma', 'transcript', 'ielts', 'motivation_letter', 'photo'
    ))
);

CREATE INDEX IF NOT EXISTS idx_university_requirements_university_id
  ON university_requirements (university_id);

-- Seed default requirements for all catalog universities
INSERT INTO university_requirements (university_id, document_type, is_required)
SELECT u.id, d.doc_type, TRUE
FROM (
  VALUES
    ('de-1'), ('de-2'), ('de-3'),
    ('hu-1'), ('hu-2'), ('hu-3'),
    ('pl-1'), ('pl-2'), ('pl-3'),
    ('it-1'), ('it-2'), ('it-3'),
    ('tr-1'), ('tr-2'), ('tr-3')
) AS u(id)
CROSS JOIN (
  VALUES
    ('passport'), ('diploma'), ('transcript'),
    ('photo'), ('motivation_letter'), ('ielts')
) AS d(doc_type)
ON CONFLICT (university_id, document_type) DO NOTHING;
