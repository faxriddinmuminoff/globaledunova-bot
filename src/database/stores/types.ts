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
  findRecent(limit: number): Promise<User[]>;
  countAll(): Promise<number>;
  searchByPhone(phone: string): Promise<User[]>;
  searchByTelegramId(telegramId: number): Promise<User | null>;
  searchByName(name: string): Promise<User[]>;
}

export type StorageBackend = 'postgres' | 'memory';
