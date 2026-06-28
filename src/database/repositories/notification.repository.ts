import { getNotificationStore } from '../storage';
import { Notification } from '../../notifications/types';

export async function createNotification(data: {
  user_id: number;
  title: string;
  message: string;
  application_id?: number;
}): Promise<Notification> {
  return getNotificationStore().create(data);
}

export async function findNotificationsByUserId(userId: number): Promise<Notification[]> {
  return getNotificationStore().findByUserId(userId);
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  return getNotificationStore().countUnread(userId);
}

export async function markNotificationAsRead(
  id: number,
  userId: number,
): Promise<Notification | null> {
  return getNotificationStore().markAsRead(id, userId);
}

export async function markAllNotificationsAsRead(userId: number): Promise<number> {
  return getNotificationStore().markAllAsRead(userId);
}

export async function clearAllNotifications(userId: number): Promise<number> {
  return getNotificationStore().clearAll(userId);
}
