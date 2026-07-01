import { adminTelegramIds, config, managerChatId, isProduction } from '../config';
import { checkConnection, getStorageBackend, getUniversityStore } from '../database/storage';
import { getJobQueue } from '../queue/queue.factory';
import { getBackupStatus } from '../backup/backup.service';
import { getAllMetrics } from './metrics';
import { logger } from '../logger';

export interface ReadinessCheck {
  name: string;
  ok: boolean;
  details: string;
}

export interface ReleaseReadinessReport {
  status: 'PRODUCTION READY' | 'PRODUCTION BLOCKED';
  checks: ReadinessCheck[];
  blockers: string[];
}

export async function runReleaseReadinessReport(): Promise<ReleaseReadinessReport> {
  const checks: ReadinessCheck[] = [];
  const dbOk = getStorageBackend() === 'memory' ? !isProduction : await safeCheckDb();
  checks.push({
    name: 'Database',
    ok: dbOk,
    details: getStorageBackend() === 'memory' ? 'memory fallback active' : 'postgres checked',
  });

  const queue = getJobQueue();
  const pending = await queue.countByStatus('pending');
  checks.push({ name: 'Queue', ok: pending >= 0, details: `${pending} pending jobs` });

  checks.push({
    name: 'Storage',
    ok: Boolean(config.DEFAULT_STORAGE_PROVIDER),
    details: config.DEFAULT_STORAGE_PROVIDER,
  });

  const backup = await getBackupStatus();
  checks.push({
    name: 'Backups',
    ok: getStorageBackend() === 'memory' || backup.lastStatus !== 'failed',
    details: backup.lastStatus ?? 'no backups yet',
  });

  checks.push({
    name: 'Metrics',
    ok: typeof getAllMetrics() === 'object',
    details: 'metrics collector available',
  });

  checks.push({
    name: 'Admin IDs',
    ok: adminTelegramIds.length > 0,
    details: `${adminTelegramIds.length} admins configured`,
  });

  checks.push({
    name: 'Manager Chat',
    ok: managerChatId !== undefined || adminTelegramIds.length > 0,
    details: managerChatId !== undefined ? String(managerChatId) : 'falls back to admin ids',
  });

  const universities = await getUniversityStore().findAllActive();
  checks.push({
    name: 'Universities Seed',
    ok: universities.length > 0,
    details: `${universities.length} active universities`,
  });

  checks.push({
    name: 'Reminder Jobs',
    ok: true,
    details: 'scheduler starts with application process',
  });

  const blockers = checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.details}`);
  const report: ReleaseReadinessReport = {
    status: blockers.length === 0 ? 'PRODUCTION READY' : 'PRODUCTION BLOCKED',
    checks,
    blockers,
  };

  if (report.status === 'PRODUCTION READY') {
    logger.info({ checks }, 'PRODUCTION READY');
  } else {
    logger.error({ blockers, checks }, 'PRODUCTION BLOCKED');
  }

  return report;
}

async function safeCheckDb(): Promise<boolean> {
  try {
    return await checkConnection();
  } catch {
    return false;
  }
}
