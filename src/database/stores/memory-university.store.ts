import { CountryCode } from '../../universities/types';
import {
  CountryRecord,
  CreateUniversityInput,
  DegreeRecord,
  UniversityRecord,
  UpdateUniversityInput,
} from '../../universities/university.types';
import { UniversityStore } from '../../universities/university-store.types';
import { SEED_COUNTRIES, SEED_DEGREES, SEED_UNIVERSITIES } from '../../universities/seed-data';

export class MemoryUniversityStore implements UniversityStore {
  private universities = new Map<string, UniversityRecord>();
  private countries: CountryRecord[] = [];
  private degrees: DegreeRecord[] = [];

  async seedDefaults(
    records: UniversityRecord[],
    countries: CountryRecord[],
    degrees: DegreeRecord[],
  ): Promise<void> {
    if (this.universities.size > 0) return;
    for (const u of records) this.universities.set(u.id, { ...u });
    this.countries = countries.map((c) => ({ ...c }));
    this.degrees = degrees.map((d) => ({ ...d }));
  }

  async findAllActive(): Promise<UniversityRecord[]> {
    return [...this.universities.values()]
      .filter((u) => !u.is_archived)
      .map((u) => ({ ...u }));
  }

  async findById(id: string): Promise<UniversityRecord | null> {
    const u = this.universities.get(id);
    return u ? { ...u } : null;
  }

  async findByCountry(countryCode: CountryCode): Promise<UniversityRecord[]> {
    return [...this.universities.values()]
      .filter((u) => u.country_code === countryCode && !u.is_archived)
      .map((u) => ({ ...u }));
  }

  async create(input: CreateUniversityInput): Promise<UniversityRecord> {
    const now = new Date();
    const record: UniversityRecord = {
      id: input.id,
      country_code: input.countryCode,
      names: input.names,
      supported_degrees: input.supportedDegrees ?? ['bachelor', 'master', 'phd'],
      logo_storage_key: input.logoStorageKey ?? null,
      is_archived: false,
      sort_order: input.sortOrder ?? 0,
      created_at: now,
      updated_at: now,
    };
    this.universities.set(record.id, record);
    return { ...record };
  }

  async update(id: string, input: UpdateUniversityInput): Promise<UniversityRecord | null> {
    const existing = this.universities.get(id);
    if (!existing) return null;

    const updated: UniversityRecord = {
      ...existing,
      names: input.names ?? existing.names,
      supported_degrees: input.supportedDegrees ?? existing.supported_degrees,
      logo_storage_key: input.logoStorageKey ?? existing.logo_storage_key,
      is_archived: input.isArchived ?? existing.is_archived,
      sort_order: input.sortOrder ?? existing.sort_order,
      updated_at: new Date(),
    };
    this.universities.set(id, updated);
    return { ...updated };
  }

  async archive(id: string): Promise<boolean> {
    const result = await this.update(id, { isArchived: true });
    return result !== null;
  }

  async findCountries(): Promise<CountryRecord[]> {
    return this.countries.map((c) => ({ ...c }));
  }

  async findDegrees(): Promise<DegreeRecord[]> {
    return this.degrees.map((d) => ({ ...d }));
  }
}

export async function ensureMemoryUniversitySeed(store: MemoryUniversityStore): Promise<void> {
  await store.seedDefaults(SEED_UNIVERSITIES, SEED_COUNTRIES, SEED_DEGREES);
}
