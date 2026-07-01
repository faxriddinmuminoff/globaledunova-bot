-- Soft launch hardening: checksum-based duplicate upload protection

DO $$
DECLARE
  duplicate_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT application_id, telegram_id, checksum
    FROM documents
    WHERE checksum IS NOT NULL
    GROUP BY application_id, telegram_id, checksum
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE WARNING 'Migration 007_upload_idempotency: duplicate document checksum groups detected:';
    FOR rec IN
      SELECT application_id, telegram_id, checksum, COUNT(*)::INTEGER AS row_count
      FROM documents
      WHERE checksum IS NOT NULL
      GROUP BY application_id, telegram_id, checksum
      HAVING COUNT(*) > 1
      ORDER BY application_id, telegram_id
    LOOP
      RAISE WARNING '  application_id=%, telegram_id=%, checksum=%, duplicates=%',
        rec.application_id, rec.telegram_id, rec.checksum, rec.row_count;
    END LOOP;
    RAISE EXCEPTION
      'Migration 007_upload_idempotency aborted: % duplicate checksum group(s) found. Dedupe documents before retrying.',
      duplicate_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_app_user_checksum
  ON documents (application_id, telegram_id, checksum)
  WHERE checksum IS NOT NULL;
