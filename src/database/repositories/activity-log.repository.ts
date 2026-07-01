import { getActivityLogStore } from '../storage';
import { ActivityAction, ActivityLog } from '../../types/activity';

export async function createActivityLog(data: {
  telegram_id?: number | null;
  actor_telegram_id?: number | null;
  action: ActivityAction;
  entity_type?: string | null;
  entity_id?: number | null;
  metadata?: Record<string, unknown> | null;
}): Promise<ActivityLog> {
  return getActivityLogStore().create(data);
}

export async function findRecentActivityLogs(limit = 50): Promise<ActivityLog[]> {
  return getActivityLogStore().findRecent(limit);
}
