import { Notification } from '../../notifications/types';
import { NotificationStore } from './notification-store.types';

export class MemoryNotificationStore implements NotificationStore {
  private notifications: Notification[] = [];
  private nextId = 1;

  async create(data: {
    user_id: number;
    title: string;
    message: string;
    application_id?: number;
  }): Promise<Notification> {
    const notification: Notification = {
      id: this.nextId++,
      user_id: data.user_id,
      title: data.title,
      message: data.message,
      created_at: new Date(),
      is_read: false,
      application_id: data.application_id,
    };

    this.notifications.push(notification);
    return { ...notification };
  }

  async findByUserId(userId: number): Promise<Notification[]> {
    return this.notifications
      .filter((n) => n.user_id === userId)
      .map((n) => ({ ...n }))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async countUnread(userId: number): Promise<number> {
    return this.notifications.filter((n) => n.user_id === userId && !n.is_read).length;
  }

  async markAsRead(id: number, userId: number): Promise<Notification | null> {
    const notification = this.notifications.find((n) => n.id === id && n.user_id === userId);
    if (!notification) return null;

    notification.is_read = true;
    return { ...notification };
  }

  async markAllAsRead(userId: number): Promise<number> {
    let count = 0;
    for (const notification of this.notifications) {
      if (notification.user_id === userId && !notification.is_read) {
        notification.is_read = true;
        count++;
      }
    }
    return count;
  }

  async clearAll(userId: number): Promise<number> {
    const before = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.user_id !== userId);
    return before - this.notifications.length;
  }
}
