import { ActivityAction, ActivityLog } from '../../types/activity';

export interface ActivityLogStore {
  create(data: {
    telegram_id?: number | null;
    actor_telegram_id?: number | null;
    action: ActivityAction;
    entity_type?: string | null;
    entity_id?: number | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<ActivityLog>;

  findRecent(limit?: number): Promise<ActivityLog[]>;
}
