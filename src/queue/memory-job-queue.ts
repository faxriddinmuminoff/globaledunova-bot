import { JobQueue } from './job-queue.interface';
import { EnqueueJobInput, JobRecord, JobStatus } from './types';

export class MemoryJobQueue implements JobQueue {
  private jobs: JobRecord[] = [];
  private nextId = 1;

  async enqueue(input: EnqueueJobInput): Promise<JobRecord> {
    if (input.idempotencyKey) {
      const existing = this.jobs.find(
        (job) => job.idempotency_key === input.idempotencyKey,
      );
      if (existing) {
        if (['dead', 'failed', 'completed'].includes(existing.status)) {
          existing.job_type = input.jobType;
          existing.payload = input.payload;
          existing.status = 'pending';
          existing.attempts = 0;
          existing.max_attempts = input.maxAttempts ?? existing.max_attempts;
          existing.scheduled_at = input.scheduledAt ?? new Date();
          existing.started_at = null;
          existing.completed_at = null;
          existing.last_error = null;
          return { ...existing };
        }
        return { ...existing };
      }
    }

    const job: JobRecord = {
      id: this.nextId++,
      job_type: input.jobType,
      payload: input.payload,
      idempotency_key: input.idempotencyKey ?? null,
      status: 'pending',
      attempts: 0,
      max_attempts: input.maxAttempts ?? 3,
      scheduled_at: input.scheduledAt ?? new Date(),
      started_at: null,
      completed_at: null,
      last_error: null,
      created_at: new Date(),
    };
    this.jobs.push(job);
    return { ...job };
  }

  async claimNext(limit = 1): Promise<JobRecord[]> {
    const now = Date.now();
    const pending = this.jobs
      .filter((j) => j.status === 'pending' && j.scheduled_at.getTime() <= now)
      .sort((a, b) => a.scheduled_at.getTime() - b.scheduled_at.getTime())
      .slice(0, limit);

    for (const job of pending) {
      job.status = 'processing';
      job.started_at = new Date();
      job.attempts += 1;
    }

    return pending.map((j) => ({ ...j }));
  }

  async recoverStalled(stalledAfterMs = 15 * 60_000): Promise<number> {
    const cutoff = Date.now() - stalledAfterMs;
    let recovered = 0;

    for (const job of this.jobs) {
      if (
        job.status === 'processing' &&
        job.started_at &&
        job.started_at.getTime() <= cutoff
      ) {
        job.status = job.attempts >= job.max_attempts ? 'dead' : 'pending';
        job.last_error = 'Recovered after worker restart or stalled execution';
        job.started_at = null;
        if (job.status === 'pending') {
          job.scheduled_at = new Date();
        } else {
          job.completed_at = new Date();
        }
        recovered += 1;
      }
    }

    return recovered;
  }

  async complete(id: number): Promise<void> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return;
    job.status = 'completed';
    job.completed_at = new Date();
  }

  async fail(id: number, error: string): Promise<void> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return;
    job.last_error = error;
    job.status = job.attempts >= job.max_attempts ? 'dead' : 'pending';
    if (job.status === 'pending') {
      const delayMs = Math.min(30 * 60_000, 30_000 * 2 ** Math.max(0, job.attempts - 1));
      job.scheduled_at = new Date(Date.now() + delayMs);
    }
  }

  async moveToDeadLetter(id: number, error: string): Promise<void> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return;
    job.status = 'dead';
    job.last_error = error;
    job.completed_at = new Date();
  }

  async countByStatus(status: JobStatus): Promise<number> {
    return this.jobs.filter((j) => j.status === status).length;
  }

  async listRecentFailures(limit = 10): Promise<JobRecord[]> {
    return this.jobs
      .filter((j) => j.status === 'dead' || j.last_error)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit)
      .map((j) => ({ ...j }));
  }

  async retry(id: number): Promise<boolean> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return false;
    job.status = 'pending';
    job.attempts = 0;
    job.scheduled_at = new Date();
    job.started_at = null;
    job.completed_at = null;
    job.last_error = null;
    return true;
  }

  async ignore(id: number): Promise<boolean> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return false;
    job.status = 'completed';
    job.completed_at = new Date();
    return true;
  }
}
