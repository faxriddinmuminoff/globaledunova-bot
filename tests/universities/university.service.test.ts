import { describe, it, expect, beforeAll } from 'vitest';
import {
  MemoryUniversityStore,
  ensureMemoryUniversitySeed,
} from '../../src/database/stores/memory-university.store';
import { toUniversityInfo } from '../../src/universities/university.types';
import { filterUniversitiesForSelection } from '../../src/universities/university-store.types';

describe('university store (memory)', () => {
  let store: MemoryUniversityStore;

  beforeAll(async () => {
    store = new MemoryUniversityStore();
    await ensureMemoryUniversitySeed(store);
  });

  it('loads university by id', async () => {
    const record = await store.findById('de-1');
    expect(record).not.toBeNull();
    const uni = toUniversityInfo(record!, 'en');
    expect(uni.name).toContain('Munich');
  });

  it('lists universities for country and degree', async () => {
    const records = await store.findByCountry('de');
    const list = filterUniversitiesForSelection(records, 'de', 'bachelor', 'en');
    expect(list.length).toBe(3);
    expect(list[0].id).toMatch(/^de-/);
  });
});
