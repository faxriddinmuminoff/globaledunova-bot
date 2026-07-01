export type AuditAction =
  | 'admin_login'
  | 'application_accept'
  | 'application_reject'
  | 'documents_requested'
  | 'application_status_change'
  | 'document_verified'
  | 'document_rejected'
  | 'requirement_changed'
  | 'broadcast_created'
  | 'broadcast_sent'
  | 'broadcast_cancelled'
  | 'settings_changed'
  | 'university_created'
  | 'university_updated'
  | 'university_deleted'
  | 'backup_created';

export interface AuditMetadata {
  actorTelegramId: number;
  targetTelegramId?: number;
  applicationId?: number;
  documentId?: number;
  previousValue?: unknown;
  newValue?: unknown;
  timestamp: string;
  [key: string]: unknown;
}

export interface AuditLogEntry {
  id: number;
  admin_id: number;
  action: AuditAction;
  entity_type: string | null;
  entity_id: number | null;
  metadata: AuditMetadata | Record<string, unknown> | null;
  ip: string | null;
  created_at: Date;
}

export interface CreateAuditLogInput {
  adminId: number;
  action: AuditAction;
  entityType?: string;
  entityId?: number;
  metadata?: AuditMetadata | Record<string, unknown>;
  ip?: string | null;
}
