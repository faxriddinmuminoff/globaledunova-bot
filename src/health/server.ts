import { createServer, IncomingMessage, ServerResponse } from 'http';
import { checkConnection, getStorageBackend } from '../database/storage';
import { getQueueHealth, getSystemHealth } from '../observability/startup-diagnostics';
import {
  probeAllLatencies,
  countActiveUsersLast24h,
  countPendingNotifications,
  countPendingReminders,
} from '../observability/latency.service';
import { collectDatabaseMetrics, getAllMetrics } from '../observability/metrics';
import { getBackupStatus } from '../backup/backup.service';
import { getNotificationBot } from '../services/application-status.service';
import { getQueueOperationalHealth } from '../queue/queue-monitor.service';
import { getOperationalMetrics } from '../analytics/dashboard.service';
import { logger } from '../logger';

const startTime = Date.now();

export function startHealthServer(port: number): ReturnType<typeof createServer> {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.url === '/health' && req.method === 'GET') {
        let dbOk = false;
        try {
          dbOk = await checkConnection();
        } catch {
          dbOk = false;
        }

        const [queue, queueOps, system, metrics, operational, backup, latencies, activeUsers24h, pendingNotifications, pendingReminders] =
          await Promise.all([
            getQueueHealth(),
            getQueueOperationalHealth(),
            Promise.resolve(getSystemHealth()),
            collectDatabaseMetrics(),
            getOperationalMetrics('today'),
            getBackupStatus(),
            probeAllLatencies(getNotificationBot),
            countActiveUsersLast24h(),
            countPendingNotifications(),
            countPendingReminders(),
          ]);

        const telegramOk = getNotificationBot() !== null;
        const storageOk = getStorageBackend() === 'memory' || dbOk;
        const healthy = (dbOk || getStorageBackend() === 'memory') && telegramOk;

        const body = JSON.stringify({
          status: healthy ? 'ok' : 'degraded',
          uptime: system.uptime,
          storage: { backend: getStorageBackend(), ok: storageOk },
          database: dbOk,
          telegram: telegramOk,
          queue: { ...queue, ...queueOps },
          latency: latencies,
          backup: {
            lastBackup: backup.lastBackup,
            lastStatus: backup.lastStatus,
            databaseSizeBytes: backup.databaseSizeBytes,
          },
          system: {
            memoryMb: system.memoryMb,
            cpuCount: system.cpuCount,
          },
          activity: {
            activeUsersLast24h: activeUsers24h,
            pendingNotifications,
            pendingReminders,
          },
          metrics: { ...getAllMetrics(), ...metrics, ...operational },
          timestamp: new Date().toISOString(),
          startedAt: new Date(startTime).toISOString(),
        });

        res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(body);
        return;
      }

      if (req.url === '/metrics' && req.method === 'GET') {
        const body = JSON.stringify({
          ...getAllMetrics(),
          ...(await collectDatabaseMetrics()),
          ...(await getOperationalMetrics('today')),
          queue: await getQueueOperationalHealth(),
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    } catch (error) {
      logger.error({ error, url: req.url, method: req.method }, 'Health server request failed');
      if (!res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
      }
      res.end(
        JSON.stringify({
          status: 'degraded',
          error: 'health_check_failed',
          timestamp: new Date().toISOString(),
        }),
      );
    }
  });

  server.listen(port, () => {
    logger.info({ port }, 'Health server listening');
  });

  return server;
}
