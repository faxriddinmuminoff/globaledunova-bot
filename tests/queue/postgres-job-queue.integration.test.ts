import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closePool, query } from '../../src/database';
import { runMigrations } from '../../src/database/migrate';
import { PostgresJobQueue } from '../../src/queue/postgres-job-queue';

const runPostgresTests = process.env.RUN_POSTGRES_TESTS === '1';
const testRun = `postgres-queue-${Date.now()}`;
const describeIfPostgres = runPostgresTests ? describe : describe.skip;

async function cleanup(): Promise<void> {
  await query(
    `DELETE FROM job_queue
     WHERE idempotency_key LIKE 'test:%'
        OR payload->>'testRun' = $1`,
    [testRun],
  );
}

async function getJobStatus(id: number): Promise<string | null> {
  const rows = await query<{ status: string }>(
    'SELECT status FROM job_queue WHERE id = $1',
    [id],
  );
  return rows[0]?.status ?? null;
}

describeIfPostgres('PostgresJobQueue integration', () => {
  beforeAll(async () => {
    await runMigrations();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await closePool();
  });

  it('deduplicates jobs by idempotency key', async () => {
    const queue = new PostgresJobQueue();
    const idempotencyKey = `test:${testRun}:dedupe`;

    const first = await queue.enqueue({
      jobType: 'reminder',
      payload: { reminderType: 'scan', testRun },
      idempotencyKey,
    });
    const second = await queue.enqueue({
      jobType: 'reminder',
      payload: { reminderType: 'scan', testRun },
      idempotencyKey,
    });

    expect(second.id).toBe(first.id);
    expect(await getJobStatus(first.id)).toBe('pending');
  });

  it('recovers stalled processing jobs after restart', async () => {
    const queue = new PostgresJobQueue();
    await queue.enqueue({
      jobType: 'cleanup',
      payload: { testRun },
      idempotencyKey: `test:${testRun}:recovery`,
    });

    const [claimed] = await queue.claimNext(1);
    expect(claimed.status).toBe('processing');

    const recovered = await queue.recoverStalled(0);

    expect(recovered).toBeGreaterThanOrEqual(1);
    expect(await getJobStatus(claimed.id)).toBe('pending');
  });
});
