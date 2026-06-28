import { Notification } from '../../notifications/types';

export interface NotificationStore {
  create(data: {
    user_id: number;
    title: string;
    message: string;
    application_id?: number;
  }): Promise<Notification>;

  findByUserId(userId: number): Promise<Notification[]>;

  countUnread(userId: number): Promise<number>;

  markAsRead(id: number, userId: number): Promise<Notification | null>;

  markAllAsRead(userId: number): Promise<number>;

  clearAll(userId: number): Promise<number>;
}
