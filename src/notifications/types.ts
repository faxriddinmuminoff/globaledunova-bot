export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  created_at: Date;
  is_read: boolean;
  application_id?: number;
}

export const NOTIF_READ_ALL = 'notif:read:all';
export const NOTIF_CLEAR_ALL = 'notif:clear:all';
export const NOTIF_READ_PREFIX = 'notif:read:';
