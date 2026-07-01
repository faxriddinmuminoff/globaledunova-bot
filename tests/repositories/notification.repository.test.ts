import { describe, it, expect } from 'vitest';
import { deliverNotification } from '../../src/services/application-status.service';
import { countUnreadNotifications } from '../../src/database/repositories/notification.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('notification repository', () => {
  useFreshMemoryStorage();

  it('stores notifications via deliverNotification', async () => {
    await deliverNotification(13001, 'Title', 'Body message', 1);
    const count = await countUnreadNotifications(13001);
    expect(count).toBe(1);
  });
});
