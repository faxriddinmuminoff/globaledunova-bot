import { query, queryOne } from '../index';
import {
  DuplicateApplicationError,
  isUniqueViolation,
} from '../postgres-errors';
import {
  Application,
  ApplicationStatus,
  CountryCode,
  DegreeType,
} from '../../universities/types';
import { ApplicationStore } from './application-store.types';

interface ApplicationRow {
  id: number;
  telegram_id: string;
  university_id: string;
  country: CountryCode;
  degree: DegreeType;
  status: ApplicationStatus;
  created_at: Date;
  updated_at: Date;
}

function mapApplication(row: ApplicationRow): Application {
  return {
    ...row,
    telegram_id: Number(row.telegram_id),
  };
}

export class PostgresApplicationStore implements ApplicationStore {
  async create(data: {
    telegram_id: number;
    university_id: string;
    country: CountryCode;
    degree: DegreeType;
    status?: ApplicationStatus;
  }): Promise<Application> {
    try {
      const row = await queryOne<ApplicationRow>(
        `INSERT INTO applications (telegram_id, university_id, country, degree, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          data.telegram_id,
          data.university_id,
          data.country,
          data.degree,
          data.status ?? 'submitted',
        ],
      );

      if (!row) {
        throw new Error('Failed to create application');
      }

      return mapApplication(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateApplicationError();
      }
      throw error;
    }
  }

  async findByTelegramId(telegramId: number): Promise<Application[]> {
    const rows = await query<ApplicationRow>(
      `SELECT * FROM applications
       WHERE telegram_id = $1
       ORDER BY created_at DESC`,
      [telegramId],
    );
    return rows.map(mapApplication);
  }

  async findById(id: number, telegramId: number): Promise<Application | null> {
    const row = await queryOne<ApplicationRow>(
      'SELECT * FROM applications WHERE id = $1 AND telegram_id = $2',
      [id, telegramId],
    );
    return row ? mapApplication(row) : null;
  }

  async updateStatus(
    id: number,
    telegramId: number,
    status: ApplicationStatus,
  ): Promise<{ application: Application; previousStatus: ApplicationStatus } | null> {
    const existing = await this.findById(id, telegramId);
    if (!existing) return null;

    const previousStatus = existing.status;
    if (previousStatus === status) {
      return { application: existing, previousStatus };
    }

    const row = await queryOne<ApplicationRow>(
      `UPDATE applications
       SET status = $3, updated_at = NOW()
       WHERE id = $1 AND telegram_id = $2
       RETURNING *`,
      [id, telegramId, status],
    );

    if (!row) return null;

    return { application: mapApplication(row), previousStatus };
  }

  async exists(
    telegramId: number,
    universityId: string,
    degree: DegreeType,
  ): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM applications
         WHERE telegram_id = $1 AND university_id = $2 AND degree = $3
       ) AS exists`,
      [telegramId, universityId, degree],
    );
    return row?.exists ?? false;
  }
}
