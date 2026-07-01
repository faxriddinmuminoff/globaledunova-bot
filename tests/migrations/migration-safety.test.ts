import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { closePool, getPool, query } from '../../src/database';
import { runMigrations } from '../../src/database/migrate';

const runPostgresTests = process.env.RUN_POSTGRES_TESTS === '1';
const describeIfPostgres = runPostgresTests ? describe : describe.skip;

const migrationsDir = path.join(__dirname, '../../src/database/migrations');

async function resetMigration(filename: string): Promise<void> {
  await query('DELETE FROM schema_migrations WHERE filename = $1', [filename]);
}

describeIfPostgres('migration duplicate detection', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterAll(async () => {
    await closePool();
  });

  it('007 aborts with diagnostics when duplicate document checksums exist', async () => {
    const pool = getPool();
    const sql = fs.readFileSync(
      path.join(migrationsDir, '007_upload_idempotency.sql'),
      'utf8',
    );

    await resetMigration('007_upload_idempotency.sql');
    await pool.query('DROP INDEX IF EXISTS uq_documents_app_user_checksum');

    const app = await query<{ id: number }>(
      `INSERT INTO applications (telegram_id, university_id, country, degree, status)
       VALUES (88001, 'test-uni', 'uzbekistan', 'bachelor', 'submitted')
       RETURNING id`,
    );
    const applicationId = app[0].id;

    await query(
      `INSERT INTO documents (application_id, telegram_id, document_type, original_file_name, checksum, status)
       VALUES ($1, 88001, 'passport', 'a.pdf', 'dup-checksum', 'pending'),
              ($1, 88001, 'diploma', 'b.pdf', 'dup-checksum', 'pending')`,
      [applicationId],
    );

    await expect(pool.query(sql)).rejects.toThrow(/007_upload_idempotency aborted/i);

    await query('DELETE FROM documents WHERE telegram_id = 88001');
    await query('DELETE FROM applications WHERE id = $1', [applicationId]);
    await resetMigration('007_upload_idempotency.sql');
    await pool.query(sql);
    await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [
      '007_upload_idempotency.sql',
    ]);
  });

  it('009 aborts with diagnostics when duplicate reminder events exist', async () => {
    const pool = getPool();
    const sql = fs.readFileSync(
      path.join(migrationsDir, '009_reminder_event_idempotency.sql'),
      'utf8',
    );

    await resetMigration('009_reminder_event_idempotency.sql');
    await pool.query('DROP INDEX IF EXISTS uq_application_events_reminders');

    const app = await query<{ id: number }>(
      `INSERT INTO applications (telegram_id, university_id, country, degree, status)
       VALUES (88002, 'test-uni', 'uzbekistan', 'bachelor', 'submitted')
       RETURNING id`,
    );
    const applicationId = app[0].id;

    await query(
      `INSERT INTO application_events (application_id, event_type, actor_type, metadata)
       VALUES ($1, 'reminder_3d', 'system', '{}'),
              ($1, 'reminder_3d', 'system', '{}')`,
      [applicationId],
    );

    await expect(pool.query(sql)).rejects.toThrow(/009_reminder_event_idempotency aborted/i);

    await query('DELETE FROM application_events WHERE application_id = $1', [applicationId]);
    await query('DELETE FROM applications WHERE id = $1', [applicationId]);
    await resetMigration('009_reminder_event_idempotency.sql');
    await pool.query(sql);
    await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [
      '009_reminder_event_idempotency.sql',
    ]);
  });
});

describe('migration duplicate detection SQL', () => {
  it('007 includes duplicate detection before unique index', () => {
    const sql = fs.readFileSync(
      path.join(migrationsDir, '007_upload_idempotency.sql'),
      'utf8',
    );
    expect(sql).toMatch(/HAVING COUNT\(\*\) > 1/);
    expect(sql).toMatch(/007_upload_idempotency aborted/);
    expect(sql).toMatch(/CREATE UNIQUE INDEX/);
    expect(sql.indexOf('HAVING COUNT(*) > 1')).toBeLessThan(sql.indexOf('CREATE UNIQUE INDEX'));
  });

  it('009 includes duplicate detection before unique index', () => {
    const sql = fs.readFileSync(
      path.join(migrationsDir, '009_reminder_event_idempotency.sql'),
      'utf8',
    );
    expect(sql).toMatch(/HAVING COUNT\(\*\) > 1/);
    expect(sql).toMatch(/009_reminder_event_idempotency aborted/);
    expect(sql).toMatch(/CREATE UNIQUE INDEX/);
    expect(sql.indexOf('HAVING COUNT(*) > 1')).toBeLessThan(sql.indexOf('CREATE UNIQUE INDEX'));
  });
});
