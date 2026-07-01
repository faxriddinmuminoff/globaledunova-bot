import { getJobQueue } from '../queue/queue.factory';
import { listRecentBroadcasts } from '../broadcast/broadcast.service';
import { listRecentBackups } from '../backup/backup.service';
import { getMetric } from '../observability/metrics';

export type IncidentType =
  | 'queue_failure'
  | 'failed_broadcast'
  | 'failed_notification'
  | 'migration_failure'
  | 'backup_failure';

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  details: string;
  createdAt: Date;
  retryable: boolean;
}

export async function listIncidents(limit = 20): Promise<Incident[]> {
  const incidents: Incident[] = [];
  const queueFailures = (await getJobQueue().listRecentFailures?.(limit)) ?? [];
  for (const job of queueFailures) {
    incidents.push({
      id: `job:${job.id}`,
      type: 'queue_failure',
      title: `Queue job #${job.id} failed`,
      details: `${job.job_type}: ${job.last_error ?? 'unknown error'}`,
      createdAt: job.completed_at ?? job.started_at ?? job.created_at,
      retryable: true,
    });
  }

  const broadcasts = await listRecentBroadcasts(limit);
  for (const campaign of broadcasts.filter((b) => b.status === 'cancelled')) {
    incidents.push({
      id: `broadcast:${campaign.id}`,
      type: 'failed_broadcast',
      title: `Broadcast #${campaign.id} cancelled`,
      details: campaign.title,
      createdAt: campaign.cancelled_at ?? campaign.created_at,
      retryable: false,
    });
  }

  const backups = await listRecentBackups(limit);
  for (const backup of backups.filter((b) => b.status === 'failed')) {
    incidents.push({
      id: `backup:${backup.id}`,
      type: 'backup_failure',
      title: `Backup failed: ${backup.filename}`,
      details: backup.error_message ?? 'unknown error',
      createdAt: backup.created_at,
      retryable: true,
    });
  }

  const failedNotifications = getMetric('notifications_failed');
  if (failedNotifications > 0) {
    incidents.push({
      id: 'notification:failed',
      type: 'failed_notification',
      title: `${failedNotifications} failed notifications`,
      details: 'Telegram API wrapper recorded failed sends',
      createdAt: new Date(),
      retryable: false,
    });
  }

  return incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}

export async function formatIncidents(limit = 10): Promise<string> {
  const incidents = await listIncidents(limit);
  if (incidents.length === 0) return 'No active incidents.';
  return incidents
    .map(
      (i) =>
        `• *${i.title}*\nType: \`${i.type}\`\nID: \`${i.id}\`\n${i.details}\n${i.createdAt.toISOString()}`,
    )
    .join('\n\n');
}
