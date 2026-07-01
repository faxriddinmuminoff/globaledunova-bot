import { beforeEach } from 'vitest';
import { resetStorageForTests } from '../../src/database/storage';
import { clearMemoryAuditLogsForTests } from '../../src/audit/audit.service';
import { clearMemoryBroadcastsForTests } from '../../src/broadcast/broadcast.service';
import { clearMemorySettingsForTests } from '../../src/settings/settings.service';
import { resetJobQueueForTests } from '../../src/queue/queue.factory';
import { resetMetricsForTests } from '../../src/observability/metrics';

export async function resetTestEnvironment(): Promise<void> {
  resetJobQueueForTests();
  clearMemoryAuditLogsForTests();
  clearMemoryBroadcastsForTests();
  clearMemorySettingsForTests();
  resetMetricsForTests();
  await resetStorageForTests();
}

export function useFreshMemoryStorage(): void {
  beforeEach(async () => {
    await resetTestEnvironment();
  });
}
