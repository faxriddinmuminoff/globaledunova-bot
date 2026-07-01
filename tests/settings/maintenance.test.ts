import { describe, it, expect } from 'vitest';
import { isMaintenanceMode } from '../../src/settings/settings.service';
import { setSetting } from '../../src/settings/settings.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('maintenance mode', () => {
  useFreshMemoryStorage();

  it('reads maintenance flag', async () => {
    expect(await isMaintenanceMode()).toBe(false);
    await setSetting('maintenance_mode', true, 1);
    expect(await isMaintenanceMode()).toBe(true);
  });
});
