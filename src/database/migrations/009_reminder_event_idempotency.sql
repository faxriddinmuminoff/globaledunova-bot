-- Soft launch hardening: one reminder event per application and reminder type

DO $$
DECLARE
  duplicate_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT application_id, event_type
    FROM application_events
    WHERE event_type IN ('reminder_3d', 'reminder_7d', 'reminder_14d_manager')
    GROUP BY application_id, event_type
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE WARNING 'Migration 009_reminder_event_idempotency: duplicate reminder events detected:';
    FOR rec IN
      SELECT application_id, event_type, COUNT(*)::INTEGER AS row_count
      FROM application_events
      WHERE event_type IN ('reminder_3d', 'reminder_7d', 'reminder_14d_manager')
      GROUP BY application_id, event_type
      HAVING COUNT(*) > 1
      ORDER BY application_id, event_type
    LOOP
      RAISE WARNING '  application_id=%, event_type=%, duplicates=%',
        rec.application_id, rec.event_type, rec.row_count;
    END LOOP;
    RAISE EXCEPTION
      'Migration 009_reminder_event_idempotency aborted: % duplicate reminder event group(s) found. Dedupe application_events before retrying.',
      duplicate_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_application_events_reminders
  ON application_events (application_id, event_type)
  WHERE event_type IN ('reminder_3d', 'reminder_7d', 'reminder_14d_manager');
