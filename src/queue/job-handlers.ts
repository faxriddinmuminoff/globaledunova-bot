import { logger } from '../logger';
import { processDocumentReminders } from '../services/reminder.service';
import { runBackup } from '../backup/backup.service';
import { deliverNotification } from '../services/application-status.service';
import { processBroadcastCampaign } from '../broadcast/broadcast.service';
import { JobRecord, NotificationJobPayload, ReminderJobPayload, BroadcastJobPayload } from './types';

export async function processJob(job: JobRecord): Promise<void> {
  switch (job.job_type) {
    case 'reminder':
      await handleReminderJob(job.payload as ReminderJobPayload);
      break;
    case 'backup':
      await runBackup();
      break;
    case 'notification':
      await handleNotificationJob(job.payload as NotificationJobPayload);
      break;
    case 'broadcast':
      await processBroadcastCampaign((job.payload as BroadcastJobPayload).campaignId);
      break;
    case 'cleanup':
      logger.info('Cleanup job executed');
      break;
    default:
      logger.warn({ jobType: job.job_type }, 'Unknown job type');
  }
}

async function handleReminderJob(payload: ReminderJobPayload): Promise<void> {
  if (payload.reminderType === 'scan') {
    await processDocumentReminders();
    return;
  }
  await processDocumentReminders();
}

async function handleNotificationJob(payload: NotificationJobPayload): Promise<void> {
  await deliverNotification(
    payload.telegramId,
    payload.title,
    payload.body,
    payload.applicationId,
  );
}
