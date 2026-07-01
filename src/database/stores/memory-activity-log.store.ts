import { ActivityAction, ActivityLog } from '../../types/activity';
import { ActivityLogStore } from './activity-log-store.types';

export class MemoryActivityLogStore implements ActivityLogStore {
  private logs: ActivityLog[] = [];
  private nextId = 1;

  async create(data: {
    telegram_id?: number | null;
    actor_telegram_id?: number | null;
    action: ActivityAction;
    entity_type?: string | null;
    entity_id?: number | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: this.nextId++,
      telegram_id: data.telegram_id ?? null,
      actor_telegram_id: data.actor_telegram_id ?? null,
      action: data.action,
      entity_type: data.entity_type ?? null,
      entity_id: data.entity_id ?? null,
      metadata: data.metadata ?? null,
      created_at: new Date(),
    };
    this.logs.push(log);
    return { ...log };
  }

  async findRecent(limit = 50): Promise<ActivityLog[]> {
    return this.logs
      .map((l) => ({ ...l }))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }
}
