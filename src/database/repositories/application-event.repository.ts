import { getApplicationEventStore } from '../storage';
import { ApplicationEvent, ApplicationEventType } from '../../types/events';
import { ApplicationStatus } from '../../universities/types';

export async function createApplicationEvent(data: {
  application_id: number;
  telegram_id: number;
  event_type?: ApplicationEventType;
  from_status?: ApplicationStatus | null;
  to_status?: ApplicationStatus | null;
  changed_by?: number | null;
  message?: string | null;
}): Promise<ApplicationEvent> {
  return getApplicationEventStore().create(data);
}

export async function findApplicationEvents(applicationId: number): Promise<ApplicationEvent[]> {
  return getApplicationEventStore().findByApplicationId(applicationId);
}

export async function hasApplicationEventType(
  applicationId: number,
  eventType: ApplicationEventType,
): Promise<boolean> {
  return getApplicationEventStore().hasEventType(applicationId, eventType);
}
