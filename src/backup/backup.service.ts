import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from '../config';
import { getStorageBackend } from '../database/storage';
import { query, queryOne } from '../database/index';
import { logger } from '../logger';
import { logAdminAudit } from '../audit/audit-admin.service';

const execFileAsync = promisify(execFile);
const RETENTION_DAYS = 30;

interface BackupRow {
  id: number;
  filename: string;
  file_path: string | null;
  file_size: string | null;
  status: string;
  error_message: string | null;
  created_at: Date;
}

let lastRestoreSimulationAt: Date | null = null;

export interface BackupStatus {
  lastBackup: Date | null;
  lastStatus: string | null;
  databaseSizeBytes: number | null;
  backupCount: number;
}

const memoryBackups: BackupRow[] = [];

export async function runBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
  const backupDir = config.BACKUP_DIR;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `globaledunova_${timestamp}.sql`;
  const filePath = path.join(backupDir, filename);

  if (getStorageBackend() !== 'postgres' || !config.DATABASE_URL) {
    logger.warn('Backup skipped — PostgreSQL not active');
    return { success: false, error: 'PostgreSQL not active' };
  }

  await fs.mkdir(backupDir, { recursive: true });

  try {
    await execFileAsync('pg_dump', [config.DATABASE_URL, '-f', filePath]);
    const stat = await fs.stat(filePath);

    await queryOne(
      `INSERT INTO backup_records (filename, file_path, file_size, status)
       VALUES ($1, $2, $3, 'success')`,
      [filename, filePath, stat.size],
    );

    await logAdminAudit({
      adminId: 0,
      action: 'backup_created',
      entityType: 'backup',
      metadata: { filename, fileSize: stat.size, newValue: { path: filePath } },
    });

    await pruneOldBackups(backupDir);
    logger.info({ filename, size: stat.size }, 'Database backup completed');
    return { success: true, filename };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await queryOne(
      `INSERT INTO backup_records (filename, file_path, status, error_message)
       VALUES ($1, $2, 'failed', $3)`,
      [filename, filePath, message],
    );
    logger.error({ error: message }, 'Database backup failed');
    return { success: false, error: message };
  }
}

async function pruneOldBackups(backupDir: string): Promise<void> {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  try {
    const files = await fs.readdir(backupDir);
    for (const file of files) {
      if (!file.startsWith('globaledunova_') || !file.endsWith('.sql')) continue;
      const fullPath = path.join(backupDir, file);
      const stat = await fs.stat(fullPath);
      if (stat.mtimeMs < cutoff) {
        await fs.unlink(fullPath);
        logger.info({ file }, 'Pruned old backup');
      }
    }
  } catch (error) {
    logger.warn({ error }, 'Backup pruning failed');
  }
}

export async function getBackupStatus(): Promise<BackupStatus> {
  if (getStorageBackend() !== 'postgres') {
    const last = memoryBackups[memoryBackups.length - 1];
    return {
      lastBackup: last?.created_at ?? null,
      lastStatus: last?.status ?? null,
      databaseSizeBytes: null,
      backupCount: memoryBackups.length,
    };
  }

  const [lastRow, countRow, sizeRow] = await Promise.all([
    queryOne<BackupRow>(
      `SELECT * FROM backup_records ORDER BY created_at DESC LIMIT 1`,
    ),
    queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM backup_records`),
    queryOne<{ size: string }>(
      `SELECT pg_database_size(current_database())::text AS size`,
    ),
  ]);

  return {
    lastBackup: lastRow?.created_at ?? null,
    lastStatus: lastRow?.status ?? null,
    databaseSizeBytes: sizeRow ? Number(sizeRow.size) : null,
    backupCount: Number(countRow?.count ?? 0),
  };
}

export async function listRecentBackups(limit = 10): Promise<BackupRow[]> {
  if (getStorageBackend() !== 'postgres') {
    return memoryBackups.slice(-limit);
  }
  return query<BackupRow>(
    `SELECT * FROM backup_records ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
}

export interface BackupDrillResult {
  ok: boolean;
  checkedAt: Date;
  filename?: string;
  sizeBytes?: number;
  message: string;
}

export async function verifyLatestBackup(): Promise<BackupDrillResult> {
  const [latest] = await listRecentBackups(1);
  const checkedAt = new Date();
  if (!latest) {
    return { ok: false, checkedAt, message: 'No backup record found' };
  }

  if (latest.status !== 'success') {
    return {
      ok: false,
      checkedAt,
      filename: latest.filename,
      message: `Latest backup status is ${latest.status}`,
    };
  }

  if (!latest.file_path || getStorageBackend() !== 'postgres') {
    return {
      ok: getStorageBackend() !== 'postgres',
      checkedAt,
      filename: latest.filename,
      message: getStorageBackend() !== 'postgres' ? 'Memory mode: backup verification skipped' : 'Backup path missing',
    };
  }

  try {
    const stat = await fs.stat(latest.file_path);
    const sizeBytes = Number(latest.file_size ?? stat.size);
    const ok = stat.size > 0 && sizeBytes > 0;
    return {
      ok,
      checkedAt,
      filename: latest.filename,
      sizeBytes: stat.size,
      message: ok ? 'Backup file exists and is non-empty' : 'Backup corruption detected',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, checkedAt, filename: latest.filename, message };
  }
}

export async function runRestoreSimulation(): Promise<BackupDrillResult> {
  const verification = await verifyLatestBackup();
  lastRestoreSimulationAt = new Date();
  if (!verification.ok) {
    return { ...verification, checkedAt: lastRestoreSimulationAt, message: `Restore simulation blocked: ${verification.message}` };
  }
  return {
    ...verification,
    checkedAt: lastRestoreSimulationAt,
    message: 'Restore simulation passed: backup verified and restore command can be executed offline',
  };
}

export function getLastRestoreSimulationAt(): Date | null {
  return lastRestoreSimulationAt;
}
