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

  async findRecent(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .map((user) => ({ ...user }))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  async countAll(): Promise<number> {
    return this.users.size;
  }

  async searchByPhone(phone: string): Promise<User[]> {
    const normalized = phone.replace(/\s+/g, '');
    return Array.from(this.users.values())
      .filter((user) => user.phone_number?.replace(/\s+/g, '').includes(normalized))
      .map((user) => ({ ...user }));
  }

  async searchByTelegramId(telegramId: number): Promise<User | null> {
    return this.findUserByTelegramId(telegramId);
  }

  async searchByName(name: string): Promise<User[]> {
    const query = name.trim().toLowerCase();
    if (!query) return [];

    return Array.from(this.users.values())
      .filter((user) => user.full_name?.toLowerCase().includes(query))
      .map((user) => ({ ...user }));
  }
}
