import { createAuditLog } from './audit.service';
import { AuditAction, AuditMetadata } from './types';

export function buildAuditMetadata(
  actorTelegramId: number,
  extra: Omit<Partial<AuditMetadata>, 'actorTelegramId' | 'timestamp'> = {},
): AuditMetadata {
  return {
    actorTelegramId,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

export async function logAdminAudit(params: {
  adminId: number;
  action: AuditAction;
  entityType?: string;
  entityId?: number;
  metadata?: Omit<Partial<AuditMetadata>, 'actorTelegramId' | 'timestamp'>;
}): Promise<void> {
  await createAuditLog({
    adminId: params.adminId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: buildAuditMetadata(params.adminId, params.metadata),
  });
}

export function statusToAuditAction(
  newStatus: string,
): AuditAction {
  switch (newStatus) {
    case 'accepted':
      return 'application_accept';
    case 'rejected':
      return 'application_reject';
    case 'documents_required':
      return 'documents_requested';
    default:
      return 'application_status_change';
  }
}
