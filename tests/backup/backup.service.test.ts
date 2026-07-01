import { describe, it, expect } from 'vitest';
import { getBackupStatus, listRecentBackups, runBackup } from '../../src/backup/backup.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('backup service', () => {
  useFreshMemoryStorage();

  it('returns memory backup status when postgres inactive', async () => {
    const status = await getBackupStatus();
    expect(status).toHaveProperty('backupCount');
    expect(status.databaseSizeBytes).toBeNull();
  });

  it('skips backup without postgres', async () => {
    const result = await runBackup();
    expect(result.success).toBe(false);
  });

  it('lists recent backups in memory mode', async () => {
    const backups = await listRecentBackups(5);
    expect(Array.isArray(backups)).toBe(true);
  });
});
