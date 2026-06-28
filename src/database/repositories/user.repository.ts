import { Language, User } from '../../types';
import { getUserStore } from '../storage';

export async function findUserByTelegramId(telegramId: number): Promise<User | null> {
  return getUserStore().findUserByTelegramId(telegramId);
}

export async function createUser(telegramId: number, fullName?: string): Promise<User> {
  return getUserStore().createUser(telegramId, fullName);
}

export async function updateUserLanguage(
  telegramId: number,
  language: Language,
): Promise<User | null> {
  return getUserStore().updateUserLanguage(telegramId, language);
}

export async function updateUserPhone(
  telegramId: number,
  phoneNumber: string,
  fullName?: string,
): Promise<User | null> {
  return getUserStore().updateUserPhone(telegramId, phoneNumber, fullName);
}

export async function getOrCreateUser(
  telegramId: number,
  fullName?: string,
): Promise<User> {
  return getUserStore().getOrCreateUser(telegramId, fullName);
}

export async function isUserOnboarded(telegramId: number): Promise<boolean> {
  return getUserStore().isUserOnboarded(telegramId);
}
