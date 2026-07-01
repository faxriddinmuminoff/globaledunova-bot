import { createActivityLog } from '../database/repositories/activity-log.repository';
import { ActivityAction } from '../types/activity';

export async function logActivity(params: {
  telegramId?: number | null;
  actorTelegramId?: number | null;
  action: ActivityAction;
  entityType?: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createActivityLog({
    telegram_id: params.telegramId ?? null,
    actor_telegram_id: params.actorTelegramId ?? null,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  });
}

export async function logUserRegistered(telegramId: number): Promise<void> {
  await logActivity({
    telegramId,
    actorTelegramId: telegramId,
    action: 'user_registered',
    entityType: 'user',
    entityId: telegramId,
  });
}

export async function logApplicationCreated(
  telegramId: number,
  applicationId: number,
): Promise<void> {
  await logActivity({
    telegramId,
    actorTelegramId: telegramId,
    action: 'application_created',
    entityType: 'application',
    entityId: applicationId,
  });
}

export async function logDocumentUploaded(
  telegramId: number,
  documentId: number,
  applicationId: number,
): Promise<void> {
  await logActivity({
    telegramId,
    actorTelegramId: telegramId,
    action: 'document_uploaded',
    entityType: 'document',
    entityId: documentId,
    metadata: { applicationId },
  });
}

export async function logDocumentReviewed(
  actorTelegramId: number,
  documentId: number,
  status: 'verified' | 'rejected',
  studentTelegramId: number,
): Promise<void> {
  await logActivity({
    telegramId: studentTelegramId,
    actorTelegramId,
    action: status === 'verified' ? 'document_verified' : 'document_rejected',
    entityType: 'document',
    entityId: documentId,
  });
}

export async function logStatusChanged(
  telegramId: number,
  applicationId: number,
  fromStatus: string,
  toStatus: string,
  changedBy?: number | null,
): Promise<void> {
  await logActivity({
    telegramId,
    actorTelegramId: changedBy ?? telegramId,
    action: 'status_changed',
    entityType: 'application',
    entityId: applicationId,
    metadata: { fromStatus, toStatus },
  });
}

export async function logRequirementUpdated(
  actorTelegramId: number,
  universityId: string,
  documentType: string,
  isRequired: boolean,
): Promise<void> {
  await logActivity({
    actorTelegramId,
    action: 'requirement_updated',
    entityType: 'university_requirement',
    metadata: { universityId, documentType, isRequired },
  });
}
