import { getStorageBackend } from '../database/storage';
import { query, queryOne } from '../database/index';
import { getApplicationStore } from '../database/storage';
import { getUserStore } from '../database/storage';
import { countDocumentsByStatus } from '../database/repositories/document.repository';
import { ApplicationStatus } from '../universities/types';

export interface ManagerDashboardStats {
  applicationsToday: number;
  applicationsThisMonth: number;
  pendingReviews: number;
  documentsPending: number;
  acceptanceRate: number;
  topCountries: { country: string; count: number }[];
  topUniversities: { universityId: string; count: number }[];
  mostActiveStudents: { telegramId: number; fullName: string | null; count: number }[];
}

export async function getManagerDashboardStats(): Promise<ManagerDashboardStats> {
  if (getStorageBackend() === 'postgres') {
    const [
      todayRow,
      monthRow,
      pendingRow,
      pendingDocsRow,
      acceptedRow,
      totalAppsRow,
      countryRows,
      universityRows,
      activeRows,
    ] = await Promise.all([
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM applications
         WHERE created_at >= CURRENT_DATE`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM applications
         WHERE created_at >= date_trunc('month', CURRENT_DATE)`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM applications WHERE status = 'reviewing'`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM documents WHERE status = 'pending'`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM applications WHERE status = 'accepted'`,
      ),
      queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM applications`),
      query<{ country: string; count: string }>(
        `SELECT country, COUNT(*)::text AS count FROM applications
         GROUP BY country ORDER BY count DESC LIMIT 5`,
      ),
      query<{ university_id: string; count: string }>(
        `SELECT university_id, COUNT(*)::text AS count FROM applications
         GROUP BY university_id ORDER BY count DESC LIMIT 5`,
      ),
      query<{ telegram_id: string; full_name: string | null; count: string }>(
        `SELECT a.telegram_id, u.full_name, COUNT(*)::text AS count
         FROM applications a
         JOIN users u ON u.telegram_id = a.telegram_id
         GROUP BY a.telegram_id, u.full_name
         ORDER BY count DESC LIMIT 5`,
      ),
    ]);

    const totalApps = Number(totalAppsRow?.count ?? 0);
    const accepted = Number(acceptedRow?.count ?? 0);

    return {
      applicationsToday: Number(todayRow?.count ?? 0),
      applicationsThisMonth: Number(monthRow?.count ?? 0),
      pendingReviews: Number(pendingRow?.count ?? 0),
      documentsPending: Number(pendingDocsRow?.count ?? 0),
      acceptanceRate: totalApps > 0 ? Math.round((accepted / totalApps) * 100) : 0,
      topCountries: countryRows.map((r) => ({ country: r.country, count: Number(r.count) })),
      topUniversities: universityRows.map((r) => ({
        universityId: r.university_id,
        count: Number(r.count),
      })),
      mostActiveStudents: activeRows.map((r) => ({
        telegramId: Number(r.telegram_id),
        fullName: r.full_name,
        count: Number(r.count),
      })),
    };
  }

  const applications = await getApplicationStore().findRecent(Number.MAX_SAFE_INTEGER);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const applicationsToday = applications.filter((a) => a.created_at >= todayStart).length;
  const applicationsThisMonth = applications.filter((a) => a.created_at >= monthStart).length;
  const pendingReviews = applications.filter((a) => a.status === 'reviewing').length;
  const documentsPending = await countDocumentsByStatus('pending');
  const accepted = applications.filter((a) => a.status === 'accepted').length;
  const totalApps = applications.length;

  const countryCounts = new Map<string, number>();
  const universityCounts = new Map<string, number>();
  const studentCounts = new Map<number, number>();

  for (const app of applications) {
    countryCounts.set(app.country, (countryCounts.get(app.country) ?? 0) + 1);
    universityCounts.set(app.university_id, (universityCounts.get(app.university_id) ?? 0) + 1);
    studentCounts.set(app.telegram_id, (studentCounts.get(app.telegram_id) ?? 0) + 1);
  }

  const userStore = getUserStore();
  const mostActiveStudents = await Promise.all(
    [...studentCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(async ([telegramId, count]) => {
        const user = await userStore.findUserByTelegramId(telegramId);
        return { telegramId, fullName: user?.full_name ?? null, count };
      }),
  );

  return {
    applicationsToday,
    applicationsThisMonth,
    pendingReviews,
    documentsPending,
    acceptanceRate: totalApps > 0 ? Math.round((accepted / totalApps) * 100) : 0,
    topCountries: [...countryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count })),
    topUniversities: [...universityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([universityId, count]) => ({ universityId, count })),
    mostActiveStudents,
  };
}

export async function countApplicationsByStatus(status: ApplicationStatus): Promise<number> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM applications WHERE status = $1`,
      [status],
    );
    return Number(row?.count ?? 0);
  }

  const apps = await getApplicationStore().findRecent(Number.MAX_SAFE_INTEGER);
  return apps.filter((a) => a.status === status).length;
}
