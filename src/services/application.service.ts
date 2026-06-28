import { updateApplicationStatus } from '../database/repositories/application.repository';
import { notifyApplicationStatusChange } from './application-status.service';
import { Language } from '../types';
import { ApplicationStatus } from '../universities/types';

export async function changeApplicationStatusWithNotification(
  applicationId: number,
  telegramId: number,
  newStatus: ApplicationStatus,
  language: Language,
): Promise<boolean> {
  const result = await updateApplicationStatus(applicationId, telegramId, newStatus);
  if (!result) return false;

  const { application, previousStatus } = result;
  if (previousStatus !== newStatus) {
    await notifyApplicationStatusChange(application, previousStatus, language);
  }

  return true;
}
