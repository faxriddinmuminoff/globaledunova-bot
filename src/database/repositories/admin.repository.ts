import { getStorageBackend } from '../storage';
import { getApplicationStore } from '../storage';
import { getDocumentStore } from '../storage';
import { getUserStore } from '../storage';
import { query, queryOne } from '../index';
import {
  AdminStatistics,
  ApplicationWithStudent,
  DocumentWithStudent,
} from '../../admin/types';
import {
  Application,
  ApplicationStatus,
  APPLICATION_STATUSES,
} from '../../universities/types';
import { Language, User } from '../../types';
import { countDocumentsByStatus } from './document.repository';

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

function mapApplicationWithStudent(row: ApplicationWithStudentRow): ApplicationWithStudent {
  return {
    id: row.id,
    telegram_id: Number(row.telegram_id),
    university_id: row.university_id,
    country: row.country,
    degree: row.degree,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student_name: row.student_name,
    student_phone: row.student_phone,
    student_language: row.student_language,
  };
}

async function enrichApplicationsWithStudent(
  applications: Application[],
): Promise<ApplicationWithStudent[]> {
  const userStore = getUserStore();
  const results: ApplicationWithStudent[] = [];

  for (const app of applications) {
    const user = await userStore.findUserByTelegramId(app.telegram_id);
    results.push({
      ...app,
      student_name: user?.full_name ?? null,
      student_phone: user?.phone_number ?? null,
      student_language: user?.language ?? 'en',
    });
  }

  return results;
}

export async function findRecentApplicationsWithStudent(
  limit = 20,
): Promise<ApplicationWithStudent[]> {
  if (getStorageBackend() === 'postgres') {
    const rows = await query<ApplicationWithStudentRow>(
      `SELECT a.*,
              u.full_name AS student_name,
              u.phone_number AS student_phone,
              u.language AS student_language
       FROM applications a
       JOIN users u ON u.telegram_id = a.telegram_id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows.map(mapApplicationWithStudent);
  }

  const applications = await getApplicationStore().findRecent(limit);
  return enrichApplicationsWithStudent(applications);
}

export async function findApplicationWithStudentById(
  id: number,
): Promise<ApplicationWithStudent | null> {
  const application = await getApplicationStore().findByIdOnly(id);
  if (!application) return null;

  const [enriched] = await enrichApplicationsWithStudent([application]);
  return enriched ?? null;
}

export async function updateApplicationStatusByAdmin(
  id: number,
  status: ApplicationStatus,
): Promise<{ application: Application; previousStatus: ApplicationStatus } | null> {
  return getApplicationStore().updateStatusById(id, status);
}

export async function findRecentDocumentsWithStudent(
  limit = 20,
): Promise<DocumentWithStudent[]> {
  const documents = await getDocumentStore().findRecent(limit);
  const userStore = getUserStore();

  const results: DocumentWithStudent[] = [];
  for (const doc of documents) {
    const user = await userStore.findUserByTelegramId(doc.telegram_id);
    results.push({
      ...doc,
      student_name: user?.full_name ?? null,
    });
  }

  return results;
}

export async function findRecentStudents(limit = 20): Promise<User[]> {
  return getUserStore().findRecent(limit);
}

export async function getAdminStatistics(): Promise<AdminStatistics> {
  if (getStorageBackend() === 'postgres') {
    const [
      usersRow,
      appsRow,
      docsRow,
      statusRows,
      pendingDocsRow,
      countryRows,
      universityRows,
    ] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*)::text AS count FROM users'),
      queryOne<{ count: string }>('SELECT COUNT(*)::text AS count FROM applications'),
      queryOne<{ count: string }>('SELECT COUNT(*)::text AS count FROM documents'),
      query<{ status: ApplicationStatus; count: string }>(
        `SELECT status, COUNT(*)::text AS count
         FROM applications
         GROUP BY status`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM documents WHERE status = 'pending'`,
      ),
      query<{ country: string; count: string }>(
        `SELECT country, COUNT(*)::text AS count
         FROM applications
         GROUP BY country
         ORDER BY count DESC
         LIMIT 5`,
      ),
      query<{ university_id: string; count: string }>(
        `SELECT university_id, COUNT(*)::text AS count
         FROM applications
         GROUP BY university_id
         ORDER BY count DESC
         LIMIT 5`,
      ),
    ]);

    const applicationsByStatus: Partial<Record<ApplicationStatus, number>> = {};
    for (const status of APPLICATION_STATUSES) {
      applicationsByStatus[status] = 0;
    }
    for (const row of statusRows) {
      applicationsByStatus[row.status] = Number(row.count);
    }

    return {
      totalUsers: Number(usersRow?.count ?? 0),
      totalApplications: Number(appsRow?.count ?? 0),
      totalDocuments: Number(docsRow?.count ?? 0),
      pendingReviewApplications: applicationsByStatus.reviewing ?? 0,
      acceptedApplications: applicationsByStatus.accepted ?? 0,
      rejectedApplications: applicationsByStatus.rejected ?? 0,
      documentsRequiredApplications: applicationsByStatus.documents_required ?? 0,
      pendingDocuments: Number(pendingDocsRow?.count ?? 0),
      applicationsByStatus,
      topCountries: countryRows.map((row) => ({
        country: row.country,
        count: Number(row.count),
      })),
      topUniversities: universityRows.map((row) => ({
        universityId: row.university_id,
        count: Number(row.count),
      })),
    };
  }

  const userStore = getUserStore();
  const applicationStore = getApplicationStore();
  const documentStore = getDocumentStore();

  const [totalUsers, applications, documents, pendingDocuments] = await Promise.all([
    userStore.countAll(),
    applicationStore.findRecent(Number.MAX_SAFE_INTEGER),
    documentStore.findRecent(Number.MAX_SAFE_INTEGER),
    countDocumentsByStatus('pending'),
  ]);

  const applicationsByStatus: Partial<Record<ApplicationStatus, number>> = {};
  for (const status of APPLICATION_STATUSES) {
    applicationsByStatus[status] = 0;
  }
  for (const app of applications) {
    applicationsByStatus[app.status] = (applicationsByStatus[app.status] ?? 0) + 1;
  }

  const countryCounts = new Map<string, number>();
  const universityCounts = new Map<string, number>();
  for (const app of applications) {
    countryCounts.set(app.country, (countryCounts.get(app.country) ?? 0) + 1);
    universityCounts.set(
      app.university_id,
      (universityCounts.get(app.university_id) ?? 0) + 1,
    );
  }

  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }));

  const topUniversities = [...universityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([universityId, count]) => ({ universityId, count }));

  return {
    totalUsers,
    totalApplications: applications.length,
    totalDocuments: documents.length,
    pendingReviewApplications: applicationsByStatus.reviewing ?? 0,
    acceptedApplications: applicationsByStatus.accepted ?? 0,
    rejectedApplications: applicationsByStatus.rejected ?? 0,
    documentsRequiredApplications: applicationsByStatus.documents_required ?? 0,
    pendingDocuments,
    applicationsByStatus,
    topCountries,
    topUniversities,
  };
}
