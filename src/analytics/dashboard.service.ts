import { getStorageBackend, getApplicationStore, getDocumentStore, getUserStore } from '../database/storage';
import { queryOne } from '../database/index';
import { getMetric } from '../observability/metrics';

export type AnalyticsPeriod = 'today' | 'week' | 'month';

export interface FunnelMetrics {
  started: number;
  registered: number;
  applied: number;
  uploadedDocuments: number;
  documentsCompleted: number;
  accepted: number;
  enrolled: number;
}

export interface OperationalMetrics {
  students_registered_today: number;
  applications_today: number;
  documents_today: number;
  acceptance_rate: number;
  average_review_time: number;
  average_document_completion_time: number;
  notifications_sent: number;
  notifications_failed: number;
}

export interface AnalyticsDashboard {
  period: AnalyticsPeriod;
  funnel: FunnelMetrics;
  operational: OperationalMetrics;
  charts: {
    funnel: { label: keyof FunnelMetrics; value: number }[];
    operational: { label: keyof OperationalMetrics; value: number }[];
  };
}

function periodSql(period: AnalyticsPeriod): string {
  if (period === 'today') return "CURRENT_DATE";
  if (period === 'week') return "NOW() - interval '7 days'";
  return "NOW() - interval '30 days'";
}

export async function getAnalyticsDashboard(period: AnalyticsPeriod): Promise<AnalyticsDashboard> {
  const [funnel, operational] = await Promise.all([
    getFunnelMetrics(period),
    getOperationalMetrics(period),
  ]);

  return {
    period,
    funnel,
    operational,
    charts: {
      funnel: Object.entries(funnel).map(([label, value]) => ({
        label: label as keyof FunnelMetrics,
        value,
      })),
      operational: Object.entries(operational).map(([label, value]) => ({
        label: label as keyof OperationalMetrics,
        value,
      })),
    },
  };
}

export async function getFunnelMetrics(period: AnalyticsPeriod): Promise<FunnelMetrics> {
  if (getStorageBackend() === 'postgres') {
    const since = periodSql(period);
    const [users, apps, docs, completed, accepted, enrolled] = await Promise.all([
      queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users WHERE created_at >= ${since}`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM applications WHERE created_at >= ${since}`),
      queryOne<{ count: string }>(`SELECT COUNT(DISTINCT application_id)::text AS count FROM documents WHERE uploaded_at >= ${since}`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM applications WHERE status = 'documents_completed' AND updated_at >= ${since}`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM applications WHERE status = 'accepted' AND updated_at >= ${since}`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM applications WHERE status = 'enrolled' AND updated_at >= ${since}`),
    ]);
    const registered = Number(users?.count ?? 0);
    return {
      started: registered,
      registered,
      applied: Number(apps?.count ?? 0),
      uploadedDocuments: Number(docs?.count ?? 0),
      documentsCompleted: Number(completed?.count ?? 0),
      accepted: Number(accepted?.count ?? 0),
      enrolled: Number(enrolled?.count ?? 0),
    };
  }

  const [users, apps, docs] = await Promise.all([
    getUserStore().findRecent(Number.MAX_SAFE_INTEGER),
    getApplicationStore().findRecent(Number.MAX_SAFE_INTEGER),
    getDocumentStore().findRecent(Number.MAX_SAFE_INTEGER),
  ]);
  const cutoff = getCutoff(period);
  const filteredUsers = users.filter((u) => u.created_at >= cutoff);
  const filteredApps = apps.filter((a) => a.created_at >= cutoff);
  const filteredDocs = docs.filter((d) => d.uploaded_at >= cutoff);
  return {
    started: filteredUsers.length,
    registered: filteredUsers.length,
    applied: filteredApps.length,
    uploadedDocuments: new Set(filteredDocs.map((d) => d.application_id)).size,
    documentsCompleted: filteredApps.filter((a) => a.status === 'documents_completed').length,
    accepted: filteredApps.filter((a) => a.status === 'accepted').length,
    enrolled: filteredApps.filter((a) => a.status === 'enrolled').length,
  };
}

export async function getOperationalMetrics(period: AnalyticsPeriod): Promise<OperationalMetrics> {
  const funnel = await getFunnelMetrics(period);
  const totalApps = Math.max(1, funnel.applied);
  return {
    students_registered_today: (await getFunnelMetrics('today')).registered,
    applications_today: (await getFunnelMetrics('today')).applied,
    documents_today: (await getFunnelMetrics('today')).uploadedDocuments,
    acceptance_rate: Math.round((funnel.accepted / totalApps) * 100),
    average_review_time: 0,
    average_document_completion_time: 0,
    notifications_sent: getMetric('notifications_sent'),
    notifications_failed: getMetric('notifications_failed'),
  };
}

function getCutoff(period: AnalyticsPeriod): Date {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = period === 'week' ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function formatAnalyticsDashboard(dashboard: AnalyticsDashboard): string {
  const funnel = dashboard.charts.funnel.map((m) => `• ${m.label}: ${m.value}`).join('\n');
  const ops = dashboard.charts.operational.map((m) => `• ${m.label}: ${m.value}`).join('\n');
  return `📊 *Dashboard (${dashboard.period})*\n\n*Funnel*\n${funnel}\n\n*Operational*\n${ops}`;
}
