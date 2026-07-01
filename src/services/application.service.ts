import { transitionApplicationStatus } from './application-timeline.service';
import { Language } from '../types';
import { ApplicationStatus } from '../universities/types';

export async function changeApplicationStatusWithNotification(
  applicationId: number,
  telegramId: number,
  newStatus: ApplicationStatus,
  language: Language,
): Promise<boolean> {
  const result = await transitionApplicationStatus({
    applicationId,
    newStatus,
    changedBy: telegramId,
    language,
    notify: true,
  });

  return result.success;
}
