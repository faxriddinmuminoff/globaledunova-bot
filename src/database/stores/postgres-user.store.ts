import { queryOne, query } from '../index';
import { Language, User } from '../../types';
import { UserStore } from './types';

interface UserRow {
  id: number;
  telegram_id: string;
  language: Language;
  phone_number: string | null;
  full_name: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapUser(row: UserRow): User {
  return {
    ...row,
    telegram_id: Number(row.telegram_id),
  };
}

export class PostgresUserStore implements UserStore {
  async findUserByTelegramId(telegramId: number): Promise<User | null> {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId],
    );
    return row ? mapUser(row) : null;
  }

  async createUser(telegramId: number, fullName?: string): Promise<User> {
    const row = await queryOne<UserRow>(
      `INSERT INTO users (telegram_id, full_name)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [telegramId, fullName ?? null],
    );

    if (!row) {
      throw new Error('Failed to create user');
    }

    return mapUser(row);
  }

  async updateUserLanguage(
    telegramId: number,
    language: Language,
  ): Promise<User | null> {
    const row = await queryOne<UserRow>(
      `UPDATE users SET language = $2, updated_at = NOW()
       WHERE telegram_id = $1
       RETURNING *`,
      [telegramId, language],
    );
    return row ? mapUser(row) : null;
  }

  async updateUserPhone(
    telegramId: number,
    phoneNumber: string,
    fullName?: string,
  ): Promise<User | null> {
    const row = await queryOne<UserRow>(
      `UPDATE users SET phone_number = $2, full_name = COALESCE($3, full_name), updated_at = NOW()
       WHERE telegram_id = $1
       RETURNING *`,
      [telegramId, phoneNumber, fullName ?? null],
    );
    return row ? mapUser(row) : null;
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
    const rows = await query<UserRow>(
      `SELECT * FROM users
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows.map(mapUser);
  }

  async countAll(): Promise<number> {
    const row = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM users',
    );
    return Number(row?.count ?? 0);
  }

  async searchByPhone(phone: string): Promise<User[]> {
    const normalized = phone.replace(/\s+/g, '');
    const rows = await query<UserRow>(
      `SELECT * FROM users
       WHERE REPLACE(phone_number, ' ', '') ILIKE $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [`%${normalized}%`],
    );
    return rows.map(mapUser);
  }

  async searchByTelegramId(telegramId: number): Promise<User | null> {
    return this.findUserByTelegramId(telegramId);
  }

  async searchByName(name: string): Promise<User[]> {
    const queryText = name.trim();
    if (!queryText) return [];

    const rows = await query<UserRow>(
      `SELECT * FROM users
       WHERE full_name ILIKE $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [`%${queryText}%`],
    );
    return rows.map(mapUser);
  }
}
