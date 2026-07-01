import fs from 'fs';
import path from 'path';
import { getPool, closePool } from './index';
import { logger } from '../logger';

async function getAppliedMigrations(): Promise<{ filename: string; id: number }[]> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const result = await pool.query<{ filename: string; id: number }>(
    'SELECT filename, id FROM schema_migrations ORDER BY id',
  );

  return result.rows;
}

async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    logger.warn('No migrations directory found');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();

  const applied = await getAppliedMigrations();
  const appliedSet = new Set(applied.map((row) => row.filename));
  const pool = getPool();

  for (const file of files) {
    if (appliedSet.has(file)) {
      logger.debug({ file }, 'Migration already applied');
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    logger.info({ file }, 'Applying migration');

    await pool.query('BEGIN');

    try {
      await pool.query(sql);
      await pool.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file],
      );
      await pool.query('COMMIT');
      logger.info({ file }, 'Migration applied successfully');
    } catch (error) {
      await pool.query('ROLLBACK');
      logger.error({ file, error }, 'Migration failed');
      throw error;
    }
  }
}

async function rollbackLastMigration(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    logger.info('No migrations to rollback');
    return;
  }

  const last = applied[applied.length - 1];
  const downFile = last.filename.replace('.sql', '.down.sql');
  const downPath = path.join(migrationsDir, downFile);

  if (!fs.existsSync(downPath)) {
    throw new Error(`Rollback file not found: ${downFile}`);
  }

  const sql = fs.readFileSync(downPath, 'utf-8');
  const pool = getPool();

  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('DELETE FROM schema_migrations WHERE id = $1', [last.id]);
    await pool.query('COMMIT');
    logger.info({ file: last.filename }, 'Migration rolled back');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

async function main(): Promise<void> {
  const rollback = process.argv.includes('--rollback');

  try {
    if (rollback) {
      await rollbackLastMigration();
    } else {
      await runMigrations();
    }
    logger.info(rollback ? 'Rollback completed' : 'All migrations completed');
  } catch (error) {
    logger.error({ error }, 'Migration process failed');
    process.exit(1);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  main();
}

export { runMigrations, rollbackLastMigration };
