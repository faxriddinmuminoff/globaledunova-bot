import { describe, it, expect } from 'vitest';
import { useFreshMemoryStorage } from '../helpers/test-storage';
import { getJobQueue } from '../../src/queue/queue.factory';
import {
  getQueueOperationalHealth,
  retryQueueJob,
  ignoreQueueJob,
} from '../../src/queue/queue-monitor.service';

describe('queue monitor service', () => {
  useFreshMemoryStorage();

  it('reports queue status counts', async () => {
    await getJobQueue().enqueue({ jobType: 'cleanup', payload: {} });
    const health = await getQueueOperationalHealth();
    expect(health.pending).toBe(1);
    expect(health.deadLetter).toBe(0);
  });

  it('retries and ignores jobs', async () => {
    const job = await getJobQueue().enqueue({ jobType: 'cleanup', payload: {} });
    const [claimed] = await getJobQueue().claimNext(1);
    await getJobQueue().moveToDeadLetter(claimed.id, 'boom');

    expect(await retryQueueJob(job.id)).toBe(true);
    expect(await ignoreQueueJob(job.id)).toBe(true);
  });
});
