import { getApplicationStore } from '../storage';
import { CountryCode, DegreeType, Application, ApplicationStatus } from '../../universities/types';

export async function createApplication(data: {
  telegram_id: number;
  university_id: string;
  country: CountryCode;
  degree: DegreeType;
  status?: ApplicationStatus;
}): Promise<Application> {
  return getApplicationStore().create(data);
}

export async function findApplicationsByTelegramId(
  telegramId: number,
): Promise<Application[]> {
  return getApplicationStore().findByTelegramId(telegramId);
}

export async function findApplicationById(
  id: number,
  telegramId: number,
): Promise<Application | null> {
  return getApplicationStore().findById(id, telegramId);
}

export async function updateApplicationStatus(
  id: number,
  telegramId: number,
  status: ApplicationStatus,
): Promise<{ application: Application; previousStatus: ApplicationStatus } | null> {
  return getApplicationStore().updateStatus(id, telegramId, status);
}

export async function applicationExists(
  telegramId: number,
  universityId: string,
  degree: DegreeType,
): Promise<boolean> {
  return getApplicationStore().exists(telegramId, universityId, degree);
}
