import { query, queryOne } from '../index';
import { ActivityAction, ActivityLog } from '../../types/activity';
import { ActivityLogStore } from './activity-log-store.types';

interface ActivityLogRow {
  id: number;
  telegram_id: string | null;
  actor_telegram_id: string | null;
  action: ActivityAction;
  entity_type: string | null;
  entity_id: number | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

function mapLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    telegram_id: row.telegram_id !== null ? Number(row.telegram_id) : null,
    actor_telegram_id:
      row.actor_telegram_id !== null ? Number(row.actor_telegram_id) : null,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: row.metadata,
    created_at: row.created_at,
  };
}

export class PostgresActivityLogStore implements ActivityLogStore {
  async create(data: {
    telegram_id?: number | null;
    actor_telegram_id?: number | null;
    action: ActivityAction;
    entity_type?: string | null;
    entity_id?: number | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<ActivityLog> {
    const row = await queryOne<ActivityLogRow>(
      `INSERT INTO activity_logs (
         telegram_id, actor_telegram_id, action, entity_type, entity_id, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.telegram_id ?? null,
        data.actor_telegram_id ?? null,
        data.action,
        data.entity_type ?? null,
        data.entity_id ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );

    if (!row) throw new Error('Failed to create activity log');
    return mapLog(row);
  }

  async findRecent(limit = 50): Promise<ActivityLog[]> {
    const rows = await query<ActivityLogRow>(
      `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(mapLog);
  }
}
