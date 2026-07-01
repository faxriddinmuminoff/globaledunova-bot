import { getStorageBackend } from '../database/storage';
import { query, queryOne } from '../database/index';
import { CreateAuditLogInput, AuditLogEntry } from './types';

interface AuditRow {
  id: number;
  admin_id: string;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: Date;
}

const memoryLogs: AuditLogEntry[] = [];
let memoryNextId = 1;

function mapRow(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    admin_id: Number(row.admin_id),
    action: row.action as AuditLogEntry['action'],
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: row.metadata,
    ip: row.ip,
    created_at: row.created_at,
  };
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogEntry> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<AuditRow>(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, metadata, ip)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.adminId,
        input.action,
        input.entityType ?? null,
        input.entityId ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.ip ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create audit log');
    return mapRow(row);
  }

  const entry: AuditLogEntry = {
    id: memoryNextId++,
    admin_id: input.adminId,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? null,
    ip: input.ip ?? null,
    created_at: new Date(),
  };
  memoryLogs.push(entry);
  return { ...entry };
}

export async function getRecentAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  if (getStorageBackend() === 'postgres') {
    const rows = await query<AuditRow>(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(mapRow);
  }
  return memoryLogs.slice(-limit).reverse();
}

export function clearMemoryAuditLogsForTests(): void {
  memoryLogs.length = 0;
  memoryNextId = 1;
}
