import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSetting,
  setSetting,
  clearMemorySettingsForTests,
} from '../../src/settings/settings.service';

describe('settings service', () => {
  beforeEach(() => {
    clearMemorySettingsForTests();
  });

  it('returns defaults when not set', async () => {
    expect(await getSetting<string>('bot_name')).toBe('GlobalEduNova');
    expect(await getSetting<boolean>('maintenance_mode')).toBe(false);
  });

  it('persists updated values in memory', async () => {
    await setSetting('bot_name', 'EduBot', 123);
    expect(await getSetting<string>('bot_name')).toBe('EduBot');
  });
});
