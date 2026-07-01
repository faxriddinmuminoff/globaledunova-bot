-- Soft launch hardening: per-recipient broadcast delivery idempotency

CREATE TABLE IF NOT EXISTS broadcast_deliveries (
  campaign_id BIGINT NOT NULL REFERENCES broadcast_campaigns (id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'sent',
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  PRIMARY KEY (campaign_id, telegram_id),
  CONSTRAINT chk_broadcast_deliveries_status CHECK (status IN ('sending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_campaign_status
  ON broadcast_deliveries (campaign_id, status);
