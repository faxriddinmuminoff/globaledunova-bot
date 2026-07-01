import { ApplicationEvent, ApplicationEventType } from '../../types/events';
import { ApplicationStatus } from '../../universities/types';
import { ApplicationEventStore } from './application-event-store.types';

export class MemoryApplicationEventStore implements ApplicationEventStore {
  private events: ApplicationEvent[] = [];
  private nextId = 1;

  async create(data: {
    application_id: number;
    telegram_id: number;
    event_type?: ApplicationEventType;
    from_status?: ApplicationStatus | null;
    to_status?: ApplicationStatus | null;
    changed_by?: number | null;
    message?: string | null;
  }): Promise<ApplicationEvent> {
    const event: ApplicationEvent = {
      id: this.nextId++,
      application_id: data.application_id,
      telegram_id: data.telegram_id,
      event_type: data.event_type ?? 'status_change',
      from_status: data.from_status ?? null,
      to_status: data.to_status ?? null,
      changed_by: data.changed_by ?? null,
      message: data.message ?? null,
      created_at: new Date(),
    };
    this.events.push(event);
    return { ...event };
  }

  async findByApplicationId(applicationId: number): Promise<ApplicationEvent[]> {
    return this.events
      .filter((e) => e.application_id === applicationId)
      .map((e) => ({ ...e }))
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }

  async hasEventType(applicationId: number, eventType: ApplicationEventType): Promise<boolean> {
    return this.events.some(
      (e) => e.application_id === applicationId && e.event_type === eventType,
    );
  }
}
