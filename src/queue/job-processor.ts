import { logger } from '../logger';
import { config } from '../config';
import { getJobQueue } from './queue.factory';
import { processJob } from './job-handlers';
import {
  trackQueueJobCompleted,
  trackQueueJobDuration,
  trackQueueJobFailed,
} from '../observability/metrics';
import { reportCriticalError } from '../errors/error-reporter';
import { JobRecord } from './types';

const WORKER_INTERVAL_MS = 5_000;
let consecutiveFailures = 0;
let circuitOpenUntil = 0;
let tickInProgress = false;

async function processClaimedJob(job: JobRecord): Promise<void> {
  const started = Date.now();

  try {
    await processJob(job);
    await getJobQueue().complete(job.id);
    consecutiveFailures = 0;
    trackQueueJobCompleted();
    trackQueueJobDuration(Date.now() - started);
    logger.info(
      {
        jobId: job.id,
        jobType: job.job_type,
        durationMs: Date.now() - started,
        attempts: job.attempts,
      },
      'Queue job completed',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      {
        jobId: job.id,
        jobType: job.job_type,
        error: message,
        durationMs: Date.now() - started,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
      },
      'Job processing failed',
    );
    consecutiveFailures += 1;
    trackQueueJobFailed();
    trackQueueJobDuration(Date.now() - started);
    await reportCriticalError(error, {
      handler: `queue:${job.job_type}`,
      payload: { jobId: job.id, payload: job.payload },
    });
    if (job.attempts >= job.max_attempts) {
      await getJobQueue().moveToDeadLetter(job.id, message);
    } else {
      await getJobQueue().fail(job.id, message);
    }

    if (consecutiveFailures >= config.QUEUE_CIRCUIT_BREAKER_FAILURES) {
      circuitOpenUntil = Date.now() + 60_000;
      logger.error({ consecutiveFailures }, 'Queue circuit breaker opened');
      consecutiveFailures = 0;
    }
  }
}

export function startJobWorker(intervalMs = WORKER_INTERVAL_MS): NodeJS.Timeout {
  const tick = async () => {
    if (tickInProgress) {
      logger.warn('Previous queue worker tick still running; skipping overlapping tick');
      return;
    }

    tickInProgress = true;

    try {
      if (Date.now() < circuitOpenUntil) {
        logger.warn({ circuitOpenUntil }, 'Queue circuit breaker is open');
        return;
      }

      const queue = getJobQueue();
      const recovered = await queue.recoverStalled?.(config.QUEUE_STALLED_AFTER_MS);
      if (recovered) {
        logger.warn({ recovered }, 'Recovered stalled queue jobs');
      }

      const jobs = await queue.claimNext(config.QUEUE_CONCURRENCY);
      await Promise.allSettled(jobs.map((job) => processClaimedJob(job)));
    } catch (error) {
      logger.error({ error }, 'Job worker tick failed');
      await reportCriticalError(error, { handler: 'queue:worker_tick' });
    } finally {
      tickInProgress = false;
    }
  };

  void tick();
  return setInterval(() => void tick(), intervalMs);
}

export async function scheduleRecurringJobs(): Promise<void> {
  const queue = getJobQueue();
  const now = new Date();

  const nextBackup = new Date();
  nextBackup.setHours(2, 0, 0, 0);
  if (nextBackup <= now) nextBackup.setDate(nextBackup.getDate() + 1);

  await queue.enqueue({
    jobType: 'backup',
    payload: { triggeredBy: null },
    scheduledAt: nextBackup,
    idempotencyKey: `recurring:backup:daily:${nextBackup.toISOString().slice(0, 10)}`,
  });
}

export function startReminderJobScheduler(intervalMs = 6 * 60 * 60 * 1000): NodeJS.Timeout {
  const enqueueScan = () => {
    const bucket = Math.floor(Date.now() / intervalMs);
    getJobQueue()
      .enqueue({
        jobType: 'reminder',
        payload: { reminderType: 'scan' },
        idempotencyKey: `recurring:reminder:scan:${bucket}`,
      })
      .catch((error) => logger.error({ error }, 'Failed to enqueue reminder scan'));
  };

  enqueueScan();
  return setInterval(enqueueScan, intervalMs);
}

export function isQueueCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}
