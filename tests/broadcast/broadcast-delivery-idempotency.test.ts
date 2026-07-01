import { describe, it, expect, vi } from 'vitest';
import * as telegramClient from '../../src/telegram/telegram-client';
import {
  processBroadcastCampaign,
  createBroadcast,
} from '../../src/broadcast/broadcast.service';
import { setNotificationBot } from '../../src/services/application-status.service';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('broadcast delivery idempotency', () => {
  useFreshMemoryStorage();

  it('does not duplicate after crash between send and delivery mark', async () => {
    await getOrCreateUser(29001, 'Crash Target');

    const sendMessage = vi.fn().mockResolvedValue({});
    setNotificationBot({
      telegram: { sendMessage, getMe: vi.fn().mockResolvedValue({}) },
    } as never);

    const campaign = await createBroadcast({
      title: 'Crash test',
      message: 'Once only',
      filters: { allUsers: true },
      createdBy: 9001,
    });

    const sendSpy = vi.spyOn(telegramClient, 'sendTelegramMessage');
    sendSpy.mockRejectedValueOnce(new Error('simulated_crash_after_send'));

    await expect(processBroadcastCampaign(campaign.id)).rejects.toThrow(
      'simulated_crash_after_send',
    );

    sendSpy.mockResolvedValue(true);
    await processBroadcastCampaign(campaign.id);

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});
