import { config, softLaunchWhitelist, isSoftLaunchMode } from '../config';
import { getSetting } from '../settings/settings.service';
import { findApplicationsByTelegramId } from '../database/repositories/application.repository';
import { getUniversityStore } from '../database/storage';

export function isSoftLaunchEnabled(): boolean {
  return isSoftLaunchMode;
}

export async function isStudentWhitelisted(telegramId: number): Promise<boolean> {
  if (!isSoftLaunchMode) return true;
  return softLaunchWhitelist.includes(telegramId);
}

export async function canStudentApply(telegramId: number): Promise<{ allowed: boolean; reason?: string }> {
  if (!isSoftLaunchMode) return { allowed: true };

  if (!(await isStudentWhitelisted(telegramId))) {
    return { allowed: false, reason: 'soft_launch_not_whitelisted' };
  }

  const maxApps = config.SOFT_LAUNCH_MAX_APPLICATIONS;
  const apps = await findApplicationsByTelegramId(telegramId);
  if (apps.length >= maxApps) {
    return { allowed: false, reason: 'soft_launch_max_applications' };
  }

  return { allowed: true };
}

export async function isUniversityAvailableInSoftLaunch(universityId: string): Promise<boolean> {
  if (!isSoftLaunchMode) return true;

  const demoIds = await getSetting<string[]>('demo_university_ids');
  if (!Array.isArray(demoIds) || demoIds.length === 0) return true;

  return demoIds.includes(universityId);
}

export async function filterUniversitiesForSoftLaunch<T extends { id: string }>(
  universities: T[],
): Promise<T[]> {
  if (!isSoftLaunchMode) return universities;

  const demoIds = await getSetting<string[]>('demo_university_ids');
  if (!Array.isArray(demoIds) || demoIds.length === 0) return universities;

  return universities.filter((u) => demoIds.includes(u.id));
}

export async function shouldUseTestNotifications(): Promise<boolean> {
  if (!isSoftLaunchMode) return false;
  return config.SOFT_LAUNCH_TEST_NOTIFICATIONS;
}

export async function getActiveUniversityIds(): Promise<string[]> {
  const records = await getUniversityStore().findAllActive();
  return records.map((r) => r.id);
}
