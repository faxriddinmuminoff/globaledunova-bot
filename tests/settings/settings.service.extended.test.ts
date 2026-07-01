import { describe, it, expect } from 'vitest';
import {
  getSetting,
  setSetting,
  getAllSettings,
} from '../../src/settings/settings.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('settings service extended', () => {
  useFreshMemoryStorage();

  it('returns all settings list', async () => {
    const all = await getAllSettings();
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((s) => s.key === 'bot_name')).toBe(true);
  });

  it('stores complex values', async () => {
    await setSetting('reminder_intervals', { d3: 3, d7: 7, d14: 14 }, 1);
    const value = await getSetting<{ d3: number }>('reminder_intervals');
    expect(value.d3).toBe(3);
  });

  it('stores demo university ids', async () => {
    await setSetting('demo_university_ids', ['de-1', 'de-2'], 1);
    const ids = await getSetting<string[]>('demo_university_ids');
    expect(ids).toContain('de-1');
  });
});
