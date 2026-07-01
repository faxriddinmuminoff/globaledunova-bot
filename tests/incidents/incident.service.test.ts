import { describe, it, expect } from 'vitest';
import { useFreshMemoryStorage } from '../helpers/test-storage';
import { getJobQueue } from '../../src/queue/queue.factory';
import { listIncidents } from '../../src/incidents/incident.service';

describe('incident service', () => {
  useFreshMemoryStorage();

  it('lists queue failures as incidents', async () => {
    const job = await getJobQueue().enqueue({
      jobType: 'cleanup',
      payload: {},
      maxAttempts: 1,
    });
    const [claimed] = await getJobQueue().claimNext(1);
    await getJobQueue().moveToDeadLetter(claimed.id, 'boom');

    const incidents = await listIncidents();
    expect(incidents.some((i) => i.id === `job:${job.id}`)).toBe(true);
  });
});
