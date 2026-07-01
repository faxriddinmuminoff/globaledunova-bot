import os from 'os';
import { config } from '../config';
import { checkConnection, getStorageBackend } from '../database/storage';
import { getJobQueue } from '../queue/queue.factory';
import { logger } from '../logger';

export interface StartupDiagnostics {
  nodeVersion: string;
  environment: string;
  storageBackend: string;
  databaseConnected: boolean;
  healthPort: number;
  adminCount: number;
  memoryMb: number;
  cpuCount: number;
  warnings: string[];
}

export async function runStartupDiagnostics(): Promise<StartupDiagnostics> {
  const warnings: string[] = [];
  let dbConnected = false;

  try {
    dbConnected = await checkConnection();
  } catch {
    dbConnected = false;
  }

  if (config.NODE_ENV === 'production' && !config.DATABASE_URL) {
    warnings.push('DATABASE_URL missing in production');
  }

  if (!config.BOT_TOKEN) {
    warnings.push('BOT_TOKEN missing');
  }

  if (config.ADMIN_TELEGRAM_IDS === '') {
    warnings.push('No ADMIN_TELEGRAM_IDS configured');
  }

  const diagnostics: StartupDiagnostics = {
    nodeVersion: process.version,
    environment: config.NODE_ENV,
    storageBackend: getStorageBackend(),
    databaseConnected: dbConnected,
    healthPort: config.HEALTH_PORT,
    adminCount: config.ADMIN_TELEGRAM_IDS.split(',').filter(Boolean).length,
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    cpuCount: os.cpus().length,
    warnings,
  };

  if (warnings.length > 0) {
    logger.warn({ warnings }, 'Startup diagnostics warnings');
  } else {
    logger.info(diagnostics, 'Startup diagnostics OK');
  }

  return diagnostics;
}

export async function getQueueHealth(): Promise<{ pending: number; dead: number }> {
  const queue = getJobQueue();
  const [pending, dead] = await Promise.all([
    queue.countByStatus('pending'),
    queue.countByStatus('dead'),
  ]);
  return { pending, dead };
}

export function getSystemHealth(): { uptime: number; memoryMb: number; cpuCount: number } {
  return {
    uptime: Math.floor(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    cpuCount: os.cpus().length,
  };
}
