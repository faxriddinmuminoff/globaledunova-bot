import { describe, it, expect, vi } from 'vitest';
import {
  processBroadcastCampaign,
  createBroadcast,
} from '../../src/broadcast/broadcast.service';
import { setNotificationBot } from '../../src/services/application-status.service';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { getRecentAuditLogs } from '../../src/audit/audit.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('broadcast processing', () => {
  useFreshMemoryStorage();

  it('sends broadcast and completes campaign', async () => {
    await getOrCreateUser(19001, 'Target User');

    const sendMessage = vi.fn().mockResolvedValue({});
    setNotificationBot({
      telegram: { sendMessage, getMe: vi.fn().mockResolvedValue({}) },
    } as never);

    const campaign = await createBroadcast({
      title: 'Process test',
      message: 'Hello',
      filters: { allUsers: true },
      createdBy: 9001,
    });

    await processBroadcastCampaign(campaign.id);

    expect(sendMessage).toHaveBeenCalled();
    const logs = await getRecentAuditLogs(10);
    expect(logs.some((l) => l.action === 'broadcast_sent')).toBe(true);
  });
});
