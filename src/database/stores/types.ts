import { Language, User } from '../../types';

export interface UserStore {
  findUserByTelegramId(telegramId: number): Promise<User | null>;
  createUser(telegramId: number, fullName?: string): Promise<User>;
  updateUserLanguage(telegramId: number, language: Language): Promise<User | null>;
  updateUserPhone(
    telegramId: number,
    phoneNumber: string,
    fullName?: string,
  ): Promise<User | null>;
  getOrCreateUser(telegramId: number, fullName?: string): Promise<User>;
  isUserOnboarded(telegramId: number): Promise<boolean>;
}

export type StorageBackend = 'postgres' | 'memory';
