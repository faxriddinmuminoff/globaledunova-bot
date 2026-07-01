import { describe, it, expect } from 'vitest';
import { MemoryJobQueue } from '../../src/queue/memory-job-queue';

describe('MemoryJobQueue', () => {
  it('enqueues and processes jobs', async () => {
    const queue = new MemoryJobQueue();
    const job = await queue.enqueue({
      jobType: 'notification',
      payload: { telegramId: 1, title: 'Hi', body: 'Test' },
    });

    expect(job.status).toBe('pending');

    const claimed = await queue.claimNext(1);
    expect(claimed).toHaveLength(1);
    expect(claimed[0].status).toBe('processing');

    await queue.complete(claimed[0].id);
    expect(await queue.countByStatus('completed')).toBe(1);
  });

  it('moves job to dead letter after max attempts', async () => {
    const queue = new MemoryJobQueue();
    const job = await queue.enqueue({
      jobType: 'cleanup',
      payload: {},
      maxAttempts: 1,
    });

    const claimed = await queue.claimNext(1);
    await queue.fail(claimed[0].id, 'fatal error');
    expect(await queue.countByStatus('dead')).toBe(1);
    expect(job.id).toBe(claimed[0].id);
  });

  it('reuses an active job with the same idempotency key', async () => {
    const queue = new MemoryJobQueue();

    const first = await queue.enqueue({
      jobType: 'reminder',
      payload: { reminderType: 'scan' },
      idempotencyKey: 'recurring:reminder:scan:test',
    });
    const second = await queue.enqueue({
      jobType: 'reminder',
      payload: { reminderType: 'scan' },
      idempotencyKey: 'recurring:reminder:scan:test',
    });

    expect(second.id).toBe(first.id);
    expect(await queue.countByStatus('pending')).toBe(1);
  });

  it('re-enqueues completed jobs with the same idempotency key', async () => {
    const queue = new MemoryJobQueue();

    const first = await queue.enqueue({
      jobType: 'broadcast',
      payload: { campaignId: 1 },
      idempotencyKey: 'broadcast:1',
    });
    await queue.complete(first.id);

    const second = await queue.enqueue({
      jobType: 'broadcast',
      payload: { campaignId: 1 },
      idempotencyKey: 'broadcast:1',
    });

    expect(second.id).toBe(first.id);
    expect(await queue.countByStatus('pending')).toBe(1);
    expect(await queue.countByStatus('completed')).toBe(0);
  });

  it('retry() resets attempts to zero', async () => {
    const queue = new MemoryJobQueue();
    const job = await queue.enqueue({
      jobType: 'cleanup',
      payload: {},
      maxAttempts: 1,
    });

    const [claimed] = await queue.claimNext(1);
    expect(claimed.attempts).toBe(1);
    await queue.fail(claimed.id, 'fatal');
    expect(await queue.countByStatus('dead')).toBe(1);

    const ok = await queue.retry(job.id);
    expect(ok).toBe(true);

    const [retried] = await queue.claimNext(1);
    expect(retried.attempts).toBe(1);
    expect(retried.last_error).toBeNull();
    expect(retried.status).toBe('processing');
  });

  it('recovers stalled processing jobs', async () => {
    const queue = new MemoryJobQueue();
    await queue.enqueue({ jobType: 'cleanup', payload: {} });

    const [claimed] = await queue.claimNext(1);
    const recovered = await queue.recoverStalled(0);

    expect(claimed.status).toBe('processing');
    expect(recovered).toBe(1);
    expect(await queue.countByStatus('pending')).toBe(1);
    expect(await queue.countByStatus('processing')).toBe(0);
  });
});
