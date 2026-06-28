import { Language, User } from '../../types';
import { UserStore } from './types';

export class MemoryUserStore implements UserStore {
  private users = new Map<number, User>();
  private nextId = 1;

  async findUserByTelegramId(telegramId: number): Promise<User | null> {
    return this.users.get(telegramId) ?? null;
  }

  async createUser(telegramId: number, fullName?: string): Promise<User> {
    const existing = this.users.get(telegramId);
    if (existing) {
      existing.updated_at = new Date();
      return { ...existing };
    }

    const now = new Date();
    const user: User = {
      id: this.nextId++,
      telegram_id: telegramId,
      language: 'en',
      phone_number: null,
      full_name: fullName ?? null,
      created_at: now,
      updated_at: now,
    };

    this.users.set(telegramId, user);
    return { ...user };
  }

  async updateUserLanguage(
    telegramId: number,
    language: Language,
  ): Promise<User | null> {
    const user = this.users.get(telegramId);
    if (!user) return null;

    user.language = language;
    user.updated_at = new Date();
    return { ...user };
  }

  async updateUserPhone(
    telegramId: number,
    phoneNumber: string,
    fullName?: string,
  ): Promise<User | null> {
    const user = this.users.get(telegramId);
    if (!user) return null;

    user.phone_number = phoneNumber;
    if (fullName) {
      user.full_name = fullName;
    }
    user.updated_at = new Date();
    return { ...user };
  }

  async getOrCreateUser(telegramId: number, fullName?: string): Promise<User> {
    const existing = await this.findUserByTelegramId(telegramId);
    if (existing) return existing;
    return this.createUser(telegramId, fullName);
  }

  async isUserOnboarded(telegramId: number): Promise<boolean> {
    const user = await this.findUserByTelegramId(telegramId);
    return Boolean(user?.phone_number && user?.language);
  }
}
