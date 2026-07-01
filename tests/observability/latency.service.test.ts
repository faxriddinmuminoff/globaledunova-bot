import { describe, it, expect } from 'vitest';
import {
  measureQueueLatency,
  countPendingReminders,
  countActiveUsersLast24h,
} from '../../src/observability/latency.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('latency service', () => {
  useFreshMemoryStorage();

  it('measures queue latency in memory mode', async () => {
    const ms = await measureQueueLatency();
    expect(typeof ms).toBe('number');
    expect(ms).toBeGreaterThanOrEqual(0);
  });

  it('counts pending reminders via job queue', async () => {
    const count = await countPendingReminders();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('counts active users in last 24h', async () => {
    const count = await countActiveUsersLast24h();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
