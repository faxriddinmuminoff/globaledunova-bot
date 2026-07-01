-- Phase 6 hardening: queue idempotency and recovery support

ALTER TABLE job_queue
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(160);

CREATE UNIQUE INDEX IF NOT EXISTS uq_job_queue_idempotency_key
  ON job_queue (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_queue_processing_started
  ON job_queue (started_at)
  WHERE status = 'processing';
