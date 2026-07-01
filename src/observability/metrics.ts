const counters = new Map<string, number>();

export function incrementMetric(name: string, value = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + value);
}

export function getMetric(name: string): number {
  return counters.get(name) ?? 0;
}

export function getAllMetrics(): Record<string, number> {
  return Object.fromEntries(counters.entries());
}

export function resetMetricsForTests(): void {
  counters.clear();
}

export async function collectDatabaseMetrics(): Promise<Record<string, number>> {
  return {
    registered_users_total: getMetric('registered_users_total'),
    applications_total: getMetric('applications_total'),
    documents_total: getMetric('documents_total'),
    notifications_sent_total: getMetric('notifications_sent_total'),
    active_users_daily: getMetric('active_users_daily'),
    active_users_monthly: getMetric('active_users_monthly'),
    api_errors_total: getMetric('api_errors_total'),
  };
}

export function trackUserRegistration(): void {
  incrementMetric('registered_users_total');
}

export function trackApplicationCreated(): void {
  incrementMetric('applications_total');
}

export function trackDocumentUploaded(): void {
  incrementMetric('documents_total');
}

export function trackNotificationSent(): void {
  incrementMetric('notifications_sent_total');
  incrementMetric('notifications_sent');
}

export function trackNotificationFailed(): void {
  incrementMetric('notifications_failed');
}

export function trackApiError(): void {
  incrementMetric('api_errors_total');
}

export function trackActiveUser(): void {
  incrementMetric('active_users_daily');
}

export function trackQueueJobCompleted(): void {
  incrementMetric('queue_jobs_completed_total');
  incrementMetric(`queue_throughput_${Math.floor(Date.now() / 60_000)}`);
}

export function trackQueueJobDuration(durationMs: number): void {
  incrementMetric('queue_job_duration_ms_total', durationMs);
  incrementMetric('queue_job_duration_samples_total');
}

export function trackQueueJobFailed(): void {
  incrementMetric('queue_jobs_failed_total');
}

export function getQueueThroughputPerMinute(reference = new Date()): number {
  return getMetric(`queue_throughput_${Math.floor(reference.getTime() / 60_000)}`);
}
