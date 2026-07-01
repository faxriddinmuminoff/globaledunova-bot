import { getStorageBackend } from '../database/storage';
import { query, queryOne } from '../database/index';
import { getApplicationStore } from '../database/storage';
import { getUserStore } from '../database/storage';
import { AnalyticsSnapshot, ConversionFunnel } from './types';

export async function getConversionFunnel(): Promise<ConversionFunnel> {
  if (getStorageBackend() === 'postgres') {
    const [registered, applied, uploaded, accepted, enrolled] = await Promise.all([
      queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users`),
      queryOne<{ count: string }>(`SELECT COUNT(DISTINCT telegram_id)::text AS count FROM applications`),
      queryOne<{ count: string }>(
        `SELECT COUNT(DISTINCT application_id)::text AS count FROM documents`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM applications WHERE status = 'accepted'`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM applications WHERE status = 'enrolled'`,
      ),
    ]);

    return {
      registered: Number(registered?.count ?? 0),
      applied: Number(applied?.count ?? 0),
      uploadedDocuments: Number(uploaded?.count ?? 0),
      accepted: Number(accepted?.count ?? 0),
      enrolled: Number(enrolled?.count ?? 0),
    };
  }

  const users = await getUserStore().findRecent(Number.MAX_SAFE_INTEGER);
  const apps = await getApplicationStore().findRecent(Number.MAX_SAFE_INTEGER);
  const appliedUsers = new Set(apps.map((a) => a.telegram_id));

  return {
    registered: users.length,
    applied: appliedUsers.size,
    uploadedDocuments: apps.filter((a) =>
      ['documents_completed', 'accepted', 'enrolled'].includes(a.status),
    ).length,
    accepted: apps.filter((a) => a.status === 'accepted').length,
    enrolled: apps.filter((a) => a.status === 'enrolled').length,
  };
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const funnel = await getConversionFunnel();

  if (getStorageBackend() === 'postgres') {
    const [appStatus, docStatus, regByDay] = await Promise.all([
      query<{ status: string; count: string }>(
        `SELECT status, COUNT(*)::text AS count FROM applications GROUP BY status ORDER BY count DESC`,
      ),
      query<{ status: string; count: string }>(
        `SELECT status, COUNT(*)::text AS count FROM documents GROUP BY status`,
      ),
      query<{ date: string; count: string }>(
        `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS date, COUNT(*)::text AS count
         FROM users
         WHERE created_at >= NOW() - interval '30 days'
         GROUP BY created_at::date
         ORDER BY date`,
      ),
    ]);

    return {
      funnel,
      applicationsByStatus: appStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      documentsByStatus: docStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      registrationsByDay: regByDay.map((r) => ({ date: r.date, count: Number(r.count) })),
    };
  }

  return {
    funnel,
    applicationsByStatus: [],
    documentsByStatus: [],
    registrationsByDay: [],
  };
}
