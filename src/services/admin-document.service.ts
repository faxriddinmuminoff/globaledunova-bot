import { findDocumentById, updateDocumentStatus } from '../database/repositories/document.repository';
import { findUserByTelegramId } from '../database/repositories/user.repository';
import { deliverNotification } from './application-status.service';
import { logDocumentReviewed } from './activity-log.service';
import { logAdminAudit } from '../audit/audit-admin.service';
import { DocumentStatus } from '../documents/types';
import { Language } from '../types';
import { t } from '../i18n';

export async function adminVerifyDocument(
  documentId: number,
  actorTelegramId?: number,
): Promise<boolean> {
  const document = await findDocumentById(documentId);
  if (!document) return false;

  const previousStatus = document.status;
  const updated = await updateDocumentStatus(documentId, 'verified');
  if (!updated) return false;

  if (actorTelegramId) {
    await logDocumentReviewed(actorTelegramId, documentId, 'verified', updated.telegram_id);
    await logAdminAudit({
      adminId: actorTelegramId,
      action: 'document_verified',
      entityType: 'document',
      entityId: documentId,
      metadata: {
        targetTelegramId: updated.telegram_id,
        applicationId: updated.application_id,
        documentId,
        previousValue: previousStatus,
        newValue: 'verified',
      },
    });
  }

  await notifyStudentDocumentReview(updated.telegram_id, updated.document_type, 'verified');
  return true;
}

export async function adminRejectDocument(
  documentId: number,
  actorTelegramId?: number,
): Promise<boolean> {
  const document = await findDocumentById(documentId);
  if (!document) return false;

  const previousStatus = document.status;
  const updated = await updateDocumentStatus(documentId, 'rejected');
  if (!updated) return false;

  if (actorTelegramId) {
    await logDocumentReviewed(actorTelegramId, documentId, 'rejected', updated.telegram_id);
    await logAdminAudit({
      adminId: actorTelegramId,
      action: 'document_rejected',
      entityType: 'document',
      entityId: documentId,
      metadata: {
        targetTelegramId: updated.telegram_id,
        applicationId: updated.application_id,
        documentId,
        previousValue: previousStatus,
        newValue: 'rejected',
      },
    });
  }

  await notifyStudentDocumentReview(updated.telegram_id, updated.document_type, 'rejected');
  return true;
}

async function notifyStudentDocumentReview(
  telegramId: number,
  documentType: import('../documents/types').DocumentType,
  status: Extract<DocumentStatus, 'verified' | 'rejected'>,
): Promise<void> {
  const user = await findUserByTelegramId(telegramId);
  const language: Language = user?.language ?? 'en';
  const texts = t(language);
  const documentLabel = texts.documentTypes[documentType];

  const title =
    status === 'verified'
      ? texts.notificationDocumentVerifiedTitle
      : texts.notificationDocumentRejectedTitle;

  const message =
    status === 'verified'
      ? texts.notificationDocumentVerifiedMessage(documentLabel)
      : texts.notificationDocumentRejectedMessage(documentLabel);

  await deliverNotification(telegramId, title, message);
}

export async function getDocumentForAdminOpen(documentId: number) {
  return findDocumentById(documentId);
}
