import { query, queryOne } from '../index';
import { ApplicationEvent, ApplicationEventType } from '../../types/events';
import { ApplicationStatus } from '../../universities/types';
import { ApplicationEventStore } from './application-event-store.types';

interface ApplicationEventRow {
  id: number;
  application_id: number;
  telegram_id: string;
  event_type: ApplicationEventType;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus | null;
  changed_by: string | null;
  message: string | null;
  created_at: Date;
}

function mapEvent(row: ApplicationEventRow): ApplicationEvent {
  return {
    ...row,
    telegram_id: Number(row.telegram_id),
    changed_by: row.changed_by !== null ? Number(row.changed_by) : null,
  };
}

export class PostgresApplicationEventStore implements ApplicationEventStore {
  async create(data: {
    application_id: number;
    telegram_id: number;
    event_type?: ApplicationEventType;
    from_status?: ApplicationStatus | null;
    to_status?: ApplicationStatus | null;
    changed_by?: number | null;
    message?: string | null;
  }): Promise<ApplicationEvent> {
    const row = await queryOne<ApplicationEventRow>(
      `INSERT INTO application_events (
         application_id, telegram_id, event_type,
         from_status, to_status, changed_by, message
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.application_id,
        data.telegram_id,
        data.event_type ?? 'status_change',
        data.from_status ?? null,
        data.to_status ?? null,
        data.changed_by ?? null,
        data.message ?? null,
      ],
    );

    if (!row) throw new Error('Failed to create application event');
    return mapEvent(row);
  }

  async findByApplicationId(applicationId: number): Promise<ApplicationEvent[]> {
    const rows = await query<ApplicationEventRow>(
      `SELECT * FROM application_events
       WHERE application_id = $1
       ORDER BY created_at ASC`,
      [applicationId],
    );
    return rows.map(mapEvent);
  }

  async hasEventType(applicationId: number, eventType: ApplicationEventType): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM application_events
         WHERE application_id = $1 AND event_type = $2
       ) AS exists`,
      [applicationId, eventType],
    );
    return row?.exists ?? false;
  }
}
