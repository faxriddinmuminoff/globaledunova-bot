import { describe, it, expect } from 'vitest';
import {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
} from '../../src/database/repositories/notification.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('notification repository extended', () => {
  useFreshMemoryStorage();

  it('marks notifications read', async () => {
    await createNotification({
      user_id: 23001,
      title: 'A',
      message: 'One',
    });
    await createNotification({
      user_id: 23001,
      title: 'B',
      message: 'Two',
    });

    expect(await countUnreadNotifications(23001)).toBe(2);
    await markNotificationAsRead(1, 23001);
    expect(await countUnreadNotifications(23001)).toBe(1);
    await markAllNotificationsAsRead(23001);
    expect(await countUnreadNotifications(23001)).toBe(0);
  });
});
