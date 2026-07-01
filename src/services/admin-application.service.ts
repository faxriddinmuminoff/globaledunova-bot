import { logAdminAudit, statusToAuditAction } from '../audit/audit-admin.service';
import { findApplicationWithStudentById } from '../database/repositories/admin.repository';
import { transitionApplicationStatus } from './application-timeline.service';
import { AdminUpdatableStatus, ADMIN_UPDATABLE_STATUSES } from '../admin/types';
import { ApplicationStatus } from '../universities/types';

export function isAdminUpdatableStatus(status: string): status is AdminUpdatableStatus {
  return ADMIN_UPDATABLE_STATUSES.includes(status as AdminUpdatableStatus);
}

export async function adminChangeApplicationStatus(
  applicationId: number,
  newStatus: AdminUpdatableStatus,
  changedBy?: number,
): Promise<{ success: boolean; previousStatus?: ApplicationStatus }> {
  const existing = await findApplicationWithStudentById(applicationId);
  if (!existing) {
    return { success: false };
  }

  const result = await transitionApplicationStatus({
    applicationId,
    newStatus,
    changedBy: changedBy ?? null,
    language: existing.student_language,
    notify: true,
  });

  if (!result.success) {
    return { success: false };
  }

  if (changedBy) {
    await logAdminAudit({
      adminId: changedBy,
      action: statusToAuditAction(newStatus),
      entityType: 'application',
      entityId: applicationId,
      metadata: {
        targetTelegramId: existing.telegram_id,
        applicationId,
        previousValue: result.previousStatus,
        newValue: newStatus,
      },
    });
  }

  return { success: true, previousStatus: result.previousStatus };
}
