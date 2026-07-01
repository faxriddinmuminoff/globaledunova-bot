import { ApplicationStatus } from '../universities/types';

export type ApplicationEventType =
  | 'status_change'
  | 'reminder_3d'
  | 'reminder_7d'
  | 'reminder_14d_manager';

export interface ApplicationEvent {
  id: number;
  application_id: number;
  telegram_id: number;
  event_type: ApplicationEventType;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus | null;
  changed_by: number | null;
  message: string | null;
  created_at: Date;
}
