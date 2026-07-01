import { query, queryOne } from '../database/index';
import { JobQueue } from './job-queue.interface';
import { EnqueueJobInput, JobRecord, JobStatus, JobType } from './types';

interface JobRow {
  id: number;
  job_type: JobType;
  payload: Record<string, unknown>;
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

function mapJob(row: JobRow): JobRecord {
  return { ...row, payload: row.payload };
}

export class PostgresJobQueue implements JobQueue {
  async enqueue(input: EnqueueJobInput): Promise<JobRecord> {
    const row = await queryOne<JobRow>(
      `INSERT INTO job_queue (job_type, payload, scheduled_at, max_attempts, idempotency_key)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
       DO UPDATE SET
         job_type = EXCLUDED.job_type,
         payload = EXCLUDED.payload,
         status = 'pending',
         attempts = 0,
         last_error = NULL,
         scheduled_at = EXCLUDED.scheduled_at,
         started_at = NULL,
         completed_at = NULL,
         max_attempts = EXCLUDED.max_attempts
       WHERE job_queue.status IN ('dead', 'failed', 'completed')
       RETURNING *`,
      [
        input.jobType,
        JSON.stringify(input.payload),
        input.scheduledAt ?? new Date(),
        input.maxAttempts ?? 3,
        input.idempotencyKey ?? null,
      ],
    );
    if (!row) throw new Error('Failed to enqueue job');
    return mapJob(row);
  }

  async claimNext(limit = 1): Promise<JobRecord[]> {
    const rows = await query<JobRow>(
      `WITH next_jobs AS (
         SELECT id FROM job_queue
         WHERE status = 'pending' AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       UPDATE job_queue
       SET status = 'processing', started_at = NOW(), attempts = attempts + 1
       WHERE id IN (SELECT id FROM next_jobs)
       RETURNING *`,
      [limit],
    );
    return rows.map(mapJob);
  }

  async recoverStalled(stalledAfterMs = 15 * 60_000): Promise<number> {
    const rows = await query<JobRow>(
      `UPDATE job_queue
       SET last_error = COALESCE(last_error, 'Recovered after worker restart or stalled execution'),
           status = CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
           scheduled_at = CASE WHEN attempts >= max_attempts THEN scheduled_at ELSE NOW() END,
           started_at = NULL,
           completed_at = CASE WHEN attempts >= max_attempts THEN NOW() ELSE NULL END
       WHERE status = 'processing'
         AND started_at IS NOT NULL
         AND started_at <= NOW() - ($1 * interval '1 millisecond')
       RETURNING *`,
      [stalledAfterMs],
    );
    return rows.length;
  }

  async complete(id: number): Promise<void> {
    await queryOne(
      `UPDATE job_queue SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async fail(id: number, error: string): Promise<void> {
    await queryOne(
      `UPDATE job_queue
       SET last_error = $2,
           status = CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
           scheduled_at = CASE
             WHEN attempts >= max_attempts THEN scheduled_at
             ELSE NOW() + (LEAST(1800, 30 * POWER(2, GREATEST(attempts - 1, 0))) * interval '1 second')
           END
       WHERE id = $1`,
      [id, error],
    );
  }

  async moveToDeadLetter(id: number, error: string): Promise<void> {
    const job = await queryOne<JobRow>(`SELECT * FROM job_queue WHERE id = $1`, [id]);
    if (!job) return;

    await queryOne(
      `INSERT INTO dead_letter_jobs (original_job_id, job_type, payload, last_error, attempts)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, job.job_type, JSON.stringify(job.payload), error, job.attempts],
    );

    await queryOne(
      `UPDATE job_queue SET status = 'dead', last_error = $2, completed_at = NOW() WHERE id = $1`,
      [id, error],
    );
  }

  async countByStatus(status: JobStatus): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM job_queue WHERE status = $1`,
      [status],
    );
    return Number(row?.count ?? 0);
  }

  async listRecentFailures(limit = 10): Promise<JobRecord[]> {
    const rows = await query<JobRow>(
      `SELECT * FROM job_queue
       WHERE status = 'dead' OR last_error IS NOT NULL
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows.map(mapJob);
  }

  async retry(id: number): Promise<boolean> {
    const row = await queryOne<JobRow>(
      `UPDATE job_queue
       SET status = 'pending', attempts = 0, scheduled_at = NOW(), started_at = NULL, completed_at = NULL, last_error = NULL
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return row !== null;
  }

  async ignore(id: number): Promise<boolean> {
    const row = await queryOne<JobRow>(
      `UPDATE job_queue
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return row !== null;
  }
}
