import { describe, it, expect } from 'vitest';
import { useFreshMemoryStorage } from '../helpers/test-storage';
import {
  verifyLatestBackup,
  runRestoreSimulation,
  getLastRestoreSimulationAt,
} from '../../src/backup/backup.service';

describe('backup drill', () => {
  useFreshMemoryStorage();

  it('reports no backup in memory mode without failing build', async () => {
    const result = await verifyLatestBackup();
    expect(result.ok).toBe(false);
    expect(result.message).toContain('No backup');
  });

  it('records restore simulation timestamp', async () => {
    await runRestoreSimulation();
    expect(getLastRestoreSimulationAt()).toBeInstanceOf(Date);
  });
});
