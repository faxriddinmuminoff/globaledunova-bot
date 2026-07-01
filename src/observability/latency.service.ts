import { getStorageBackend } from '../database/storage';
import { queryOne } from '../database/index';
import { getJobQueue } from '../queue/queue.factory';
import { getNotificationStore } from '../database/storage';
import { getApplicationStore } from '../database/storage';
import { logger } from '../logger';

export interface LatencyProbe {
  databaseMs: number | null;
  queueMs: number | null;
  telegramMs: number | null;
}

export async function measureDatabaseLatency(): Promise<number | null> {
  if (getStorageBackend() !== 'postgres') return null;
  const start = Date.now();
  try {
    await queryOne(`SELECT 1 AS ok`);
    return Date.now() - start;
  } catch {
    return null;
  }
}

export async function measureQueueLatency(): Promise<number | null> {
  const start = Date.now();
  try {
    await getJobQueue().countByStatus('pending');
    return Date.now() - start;
  } catch {
    return null;
  }
}

export async function measureTelegramLatency(
  getBot: () => { telegram: { getMe: () => Promise<unknown> } } | null,
): Promise<number | null> {
  const bot = getBot();
  if (!bot) return null;
  const start = Date.now();
  try {
    await bot.telegram.getMe();
    return Date.now() - start;
  } catch (error) {
    logger.warn({ error }, 'Telegram latency probe failed');
    return null;
  }
}

export async function countActiveUsersLast24h(): Promise<number> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users WHERE updated_at >= NOW() - interval '24 hours'`,
    );
    return Number(row?.count ?? 0);
  }

  const users = await (await import('../database/storage')).getUserStore().findRecent(10000);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return users.filter((u) => u.updated_at.getTime() >= cutoff).length;
}

export async function countPendingNotifications(): Promise<number> {
  const store = getNotificationStore();
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notifications WHERE read_at IS NULL`,
    );
    return Number(row?.count ?? 0);
  }
  if ('findRecent' in store) {
    const all = await (store as { findRecent: (n: number) => Promise<{ read_at?: Date | null }[]> }).findRecent(10000);
    return all.filter((n) => !n.read_at).length;
  }
  return 0;
}

export async function countPendingReminders(): Promise<number> {
  return getJobQueue().countByStatus('pending');
}

export async function countApplicationsInStatus(status: string): Promise<number> {
  const apps = await getApplicationStore().findRecent(10000);
  return apps.filter((a) => a.status === status).length;
}

export async function probeAllLatencies(
  getBot: () => { telegram: { getMe: () => Promise<unknown> } } | null,
): Promise<LatencyProbe> {
  const [databaseMs, queueMs, telegramMs] = await Promise.all([
    measureDatabaseLatency(),
    measureQueueLatency(),
    measureTelegramLatency(getBot),
  ]);
  return { databaseMs, queueMs, telegramMs };
}
