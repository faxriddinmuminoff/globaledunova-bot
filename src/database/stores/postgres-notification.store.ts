import { getPool, query, queryOne } from '../index';
import { Notification } from '../../notifications/types';
import { NotificationStore } from './notification-store.types';

interface NotificationRow {
  id: number;
  user_id: string;
  title: string;
  message: string;
  created_at: Date;
  is_read: boolean;
  application_id: number | null;
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    user_id: Number(row.user_id),
    title: row.title,
    message: row.message,
    created_at: row.created_at,
    is_read: row.is_read,
    application_id: row.application_id ?? undefined,
  };
}

export class PostgresNotificationStore implements NotificationStore {
  async create(data: {
    user_id: number;
    title: string;
    message: string;
    application_id?: number;
  }): Promise<Notification> {
    const row = await queryOne<NotificationRow>(
      `INSERT INTO notifications (user_id, title, message, application_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.user_id, data.title, data.message, data.application_id ?? null],
    );

    if (!row) {
      throw new Error('Failed to create notification');
    }

    return mapNotification(row);
  }

  async findByUserId(userId: number): Promise<Notification[]> {
    const rows = await query<NotificationRow>(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(mapNotification);
  }

  async countUnread(userId: number): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );
    return Number(row?.count ?? 0);
  }

  async markAsRead(id: number, userId: number): Promise<Notification | null> {
    const row = await queryOne<NotificationRow>(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId],
    );
    return row ? mapNotification(row) : null;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const result = await getPool().query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );
    return result.rowCount ?? 0;
  }

  async clearAll(userId: number): Promise<number> {
    const result = await getPool().query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId],
    );
    return result.rowCount ?? 0;
  }
}
