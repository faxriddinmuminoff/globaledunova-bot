import fs from 'fs';
import path from 'path';
import { getPool, closePool } from './index';
import { logger } from '../logger';

async function getAppliedMigrations(): Promise<Set<string>> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const result = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY id',
  );

  return new Set(result.rows.map((row) => row.filename));
}

async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    logger.warn('No migrations directory found');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = await getAppliedMigrations();
  const pool = getPool();

  for (const file of files) {
    if (applied.has(file)) {
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

async function main(): Promise<void> {
  try {
    await runMigrations();
    logger.info('All migrations completed');
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

export { runMigrations };
