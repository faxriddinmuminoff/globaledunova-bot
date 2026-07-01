export type JobType = 'notification' | 'reminder' | 'cleanup' | 'backup' | 'broadcast';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead';

export interface JobPayload {
  [key: string]: unknown;
}

export interface NotificationJobPayload extends JobPayload {
  telegramId: number;
  title: string;
  body: string;
  applicationId?: number;
}

export interface ReminderJobPayload extends JobPayload {
  applicationId: number;
  reminderType: 'scan' | '3d' | '7d' | '14d';
}

export interface CleanupJobPayload extends JobPayload {
  retentionDays?: number;
}

export interface BackupJobPayload extends JobPayload {
  triggeredBy?: number;
}

export interface BroadcastJobPayload extends JobPayload {
  campaignId: number;
}

export interface JobRecord {
  id: number;
  job_type: JobType;
  payload: JobPayload;
  idempotency_key: string | null;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  scheduled_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  last_error: string | null;
  created_at: Date;
}

export interface EnqueueJobInput {
  jobType: JobType;
  payload: JobPayload;
  scheduledAt?: Date;
  maxAttempts?: number;
  idempotencyKey?: string;
}
