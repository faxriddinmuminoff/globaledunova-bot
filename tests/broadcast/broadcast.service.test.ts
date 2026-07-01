import { describe, it, expect } from 'vitest';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import {
  createBroadcast,
  countBroadcastTargets,
  cancelBroadcast,
  scheduleBroadcastSend,
} from '../../src/broadcast/broadcast.service';
import { getRecentAuditLogs } from '../../src/audit/audit.service';
import { getJobQueue } from '../../src/queue/queue.factory';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('broadcast service', () => {
  useFreshMemoryStorage();

  it('creates broadcast and logs audit', async () => {
    await getOrCreateUser(7001, 'Student A');
    const campaign = await createBroadcast({
      title: 'Test',
      message: 'Hello *world*',
      filters: { allUsers: true },
      createdBy: 9001,
    });

    expect(campaign.id).toBeGreaterThan(0);
    const logs = await getRecentAuditLogs(5);
    expect(logs.some((l) => l.action === 'broadcast_created')).toBe(true);
  });

  it('counts broadcast targets', async () => {
    await getOrCreateUser(7002, 'Student B');
    const count = await countBroadcastTargets({ allUsers: true });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('queues broadcast send job', async () => {
    const campaign = await createBroadcast({
      title: 'Queue test',
      message: 'Queued',
      filters: { allUsers: true },
      createdBy: 9001,
    });

    await scheduleBroadcastSend(campaign.id);
    const pending = await getJobQueue().countByStatus('pending');
    expect(pending).toBeGreaterThanOrEqual(1);
  });

  it('cancels draft broadcast', async () => {
    const campaign = await createBroadcast({
      title: 'Cancel me',
      message: 'Bye',
      filters: { allUsers: true },
      createdBy: 9001,
    });

    const ok = await cancelBroadcast(campaign.id, 9001);
    expect(ok).toBe(true);
    const logs = await getRecentAuditLogs(10);
    expect(logs.some((l) => l.action === 'broadcast_cancelled')).toBe(true);
  });
});
