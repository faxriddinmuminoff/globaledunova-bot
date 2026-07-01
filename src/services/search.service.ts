import { getStorageBackend } from '../database/storage';
import { query } from '../database/index';
import { getApplicationStore } from '../database/storage';
import { getUserStore } from '../database/storage';
import { PaginatedResult } from '../types/requirements';
import { normalizePagination, buildPaginatedResult } from '../types/pagination';
import { ApplicationWithStudent } from '../admin/types';
import { Application, ApplicationStatus, APPLICATION_STATUSES } from '../universities/types';
import { User } from '../types';
import { Language } from '../types';

export type AdminSearchType =
  | 'phone'
  | 'telegram_id'
  | 'name'
  | 'application_id'
  | 'university'
  | 'status';

export interface AdminSearchParams {
  type: AdminSearchType;
  query: string;
  page?: number;
  pageSize?: number;
}

const MAX_ADMIN_SEARCH_QUERY_LENGTH = 100;

function normalizeAdminSearchQuery(queryText: string): string | null {
  const trimmed = queryText.trim();
  if (!trimmed || trimmed.length > MAX_ADMIN_SEARCH_QUERY_LENGTH) return null;
  return trimmed;
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

interface ApplicationWithStudentRow {
  id: number;
  telegram_id: string;
  university_id: string;
  country: Application['country'];
  degree: Application['degree'];
  status: ApplicationStatus;
  created_at: Date;
  updated_at: Date;
  student_name: string | null;
  student_phone: string | null;
  student_language: Language;
}

function mapApp(row: ApplicationWithStudentRow): ApplicationWithStudent {
  return {
    ...row,
    telegram_id: Number(row.telegram_id),
  };
}

export async function searchUsersPaginated(
  type: 'phone' | 'telegram_id' | 'name',
  queryText: string,
  page = 1,
  pageSize = 10,
): Promise<PaginatedResult<User>> {
  const { page: p, pageSize: ps, offset } = normalizePagination({ page, pageSize });
  const normalizedQuery = normalizeAdminSearchQuery(queryText);
  if (!normalizedQuery) {
    return buildPaginatedResult([], 0, p, ps);
  }

  const store = getUserStore();

  let all: User[] = [];
  if (type === 'phone') all = await store.searchByPhone(normalizedQuery);
  else if (type === 'telegram_id') {
    const id = Number(normalizedQuery);
    const user = Number.isInteger(id) ? await store.searchByTelegramId(id) : null;
    all = user ? [user] : [];
  } else {
    all = await store.searchByName(normalizedQuery);
  }

  const items = all.slice(offset, offset + ps);
  return buildPaginatedResult(items, all.length, p, ps);
}

export async function searchApplicationsPaginated(
  params: AdminSearchParams,
): Promise<PaginatedResult<ApplicationWithStudent>> {
  const { page: p, pageSize: ps, offset } = normalizePagination(params);
  const normalizedQuery = normalizeAdminSearchQuery(params.query);
  if (!normalizedQuery) {
    return buildPaginatedResult([], 0, p, ps);
  }

  if (getStorageBackend() === 'postgres') {
    let where = 'WHERE 1=1';
    const values: unknown[] = [];
    let idx = 1;

    switch (params.type) {
      case 'application_id': {
        const id = Number(normalizedQuery);
        if (!Number.isInteger(id) || id <= 0) {
          return buildPaginatedResult([], 0, p, ps);
        }
        where += ` AND a.id = $${idx++}`;
        values.push(id);
        break;
      }
      case 'university': {
        where += ` AND a.university_id ILIKE $${idx++} ESCAPE '\\'`;
        values.push(`%${escapeLikePattern(normalizedQuery)}%`);
        break;
      }
      case 'status': {
        if (!APPLICATION_STATUSES.includes(normalizedQuery as ApplicationStatus)) {
          return buildPaginatedResult([], 0, p, ps);
        }
        where += ` AND a.status = $${idx++}`;
        values.push(normalizedQuery);
        break;
      }
      case 'phone': {
        where += ` AND u.phone_number ILIKE $${idx++} ESCAPE '\\'`;
        values.push(`%${escapeLikePattern(normalizedQuery.replace(/\s+/g, ''))}%`);
        break;
      }
      case 'telegram_id': {
        const id = Number(normalizedQuery);
        if (!Number.isInteger(id) || id <= 0) {
          return buildPaginatedResult([], 0, p, ps);
        }
        where += ` AND a.telegram_id = $${idx++}`;
        values.push(id);
        break;
      }
      case 'name': {
        where += ` AND u.full_name ILIKE $${idx++} ESCAPE '\\'`;
        values.push(`%${escapeLikePattern(normalizedQuery)}%`);
        break;
      }
    }

    const countRow = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM applications a
       JOIN users u ON u.telegram_id = a.telegram_id
       ${where}`,
      values,
    );
    const total = Number(countRow[0]?.count ?? 0);

    values.push(ps, offset);
    const rows = await query<ApplicationWithStudentRow>(
      `SELECT a.*, u.full_name AS student_name, u.phone_number AS student_phone,
              u.language AS student_language
       FROM applications a
       JOIN users u ON u.telegram_id = a.telegram_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    );

    return buildPaginatedResult(rows.map(mapApp), total, p, ps);
  }

  const allApps = await getApplicationStore().findRecent(Number.MAX_SAFE_INTEGER);
  const userStore = getUserStore();
  const enriched: ApplicationWithStudent[] = [];

  for (const app of allApps) {
    const user = await userStore.findUserByTelegramId(app.telegram_id);
    enriched.push({
      ...app,
      student_name: user?.full_name ?? null,
      student_phone: user?.phone_number ?? null,
      student_language: user?.language ?? 'en',
    });
  }

  const filtered = enriched.filter((app) => {
    const q = normalizedQuery.toLowerCase();
    switch (params.type) {
      case 'application_id':
        return app.id === Number(normalizedQuery);
      case 'university':
        return app.university_id.toLowerCase().includes(q);
      case 'status':
        return app.status === normalizedQuery;
      case 'phone':
        return app.student_phone?.replace(/\s+/g, '').includes(normalizedQuery.replace(/\s+/g, ''));
      case 'telegram_id':
        return app.telegram_id === Number(normalizedQuery);
      case 'name':
        return app.student_name?.toLowerCase().includes(q);
      default:
        return false;
    }
  });

  const items = filtered.slice(offset, offset + ps);
  return buildPaginatedResult(items, filtered.length, p, ps);
}
