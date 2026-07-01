import { ApplicationEvent, ApplicationEventType } from '../../types/events';
import { ApplicationStatus } from '../../universities/types';

export interface ApplicationEventStore {
  create(data: {
    application_id: number;
    telegram_id: number;
    event_type?: ApplicationEventType;
    from_status?: ApplicationStatus | null;
    to_status?: ApplicationStatus | null;
    changed_by?: number | null;
    message?: string | null;
  }): Promise<ApplicationEvent>;

  findByApplicationId(applicationId: number): Promise<ApplicationEvent[]>;

  hasEventType(applicationId: number, eventType: ApplicationEventType): Promise<boolean>;
}
