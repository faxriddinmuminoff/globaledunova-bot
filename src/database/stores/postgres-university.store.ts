import { query, queryOne } from '../index';
import { CountryCode } from '../../universities/types';
import {
  CountryRecord,
  CreateUniversityInput,
  DegreeRecord,
  UniversityRecord,
  UpdateUniversityInput,
} from '../../universities/university.types';
import { UniversityStore } from '../../universities/university-store.types';

interface UniversityRow {
  id: string;
  country_code: CountryCode;
  names: Record<string, { name: string; city: string }>;
  supported_degrees: DegreeType[];
  logo_storage_key: string | null;
  is_archived: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

type DegreeType = import('../../universities/types').DegreeType;

function mapUniversity(row: UniversityRow): UniversityRecord {
  return {
    id: row.id,
    country_code: row.country_code,
    names: row.names as UniversityRecord['names'],
    supported_degrees: row.supported_degrees,
    logo_storage_key: row.logo_storage_key,
    is_archived: row.is_archived,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class PostgresUniversityStore implements UniversityStore {
  async seedDefaults(
    _records?: UniversityRecord[],
    _countries?: CountryRecord[],
    _degrees?: DegreeRecord[],
  ): Promise<void> {
    // Seeded via migration 004
  }

  async findAllActive(): Promise<UniversityRecord[]> {
    const rows = await query<UniversityRow>(
      `SELECT * FROM universities WHERE is_archived = FALSE ORDER BY sort_order, id`,
    );
    return rows.map(mapUniversity);
  }

  async findById(id: string): Promise<UniversityRecord | null> {
    const row = await queryOne<UniversityRow>(`SELECT * FROM universities WHERE id = $1`, [id]);
    return row ? mapUniversity(row) : null;
  }

  async findByCountry(countryCode: CountryCode): Promise<UniversityRecord[]> {
    const rows = await query<UniversityRow>(
      `SELECT * FROM universities WHERE country_code = $1 AND is_archived = FALSE ORDER BY sort_order`,
      [countryCode],
    );
    return rows.map(mapUniversity);
  }

  async create(input: CreateUniversityInput): Promise<UniversityRecord> {
    const row = await queryOne<UniversityRow>(
      `INSERT INTO universities (id, country_code, names, supported_degrees, logo_storage_key, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.id,
        input.countryCode,
        JSON.stringify(input.names),
        input.supportedDegrees ?? ['bachelor', 'master', 'phd'],
        input.logoStorageKey ?? null,
        input.sortOrder ?? 0,
      ],
    );
    if (!row) throw new Error('Failed to create university');
    return mapUniversity(row);
  }

  async update(id: string, input: UpdateUniversityInput): Promise<UniversityRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const row = await queryOne<UniversityRow>(
      `UPDATE universities SET
         names = $2,
         supported_degrees = $3,
         logo_storage_key = $4,
         is_archived = $5,
         sort_order = $6,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        JSON.stringify(input.names ?? existing.names),
        input.supportedDegrees ?? existing.supported_degrees,
        input.logoStorageKey ?? existing.logo_storage_key,
        input.isArchived ?? existing.is_archived,
        input.sortOrder ?? existing.sort_order,
      ],
    );
    return row ? mapUniversity(row) : null;
  }

  async archive(id: string): Promise<boolean> {
    const result = await this.update(id, { isArchived: true });
    return result !== null;
  }

  async findCountries(): Promise<CountryRecord[]> {
    const rows = await query<{
      code: CountryCode;
      names: Record<string, string>;
      is_active: boolean;
      sort_order: number;
    }>(`SELECT code, names, is_active, sort_order FROM countries WHERE is_active = TRUE ORDER BY sort_order`);
    return rows.map((r) => ({
      code: r.code,
      names: r.names as CountryRecord['names'],
      is_active: r.is_active,
      sort_order: r.sort_order,
    }));
  }

  async findDegrees(): Promise<DegreeRecord[]> {
    const rows = await query<{
      code: DegreeType;
      names: Record<string, string>;
      is_active: boolean;
      sort_order: number;
    }>(`SELECT code, names, is_active, sort_order FROM degree_types WHERE is_active = TRUE ORDER BY sort_order`);
    return rows.map((r) => ({
      code: r.code,
      names: r.names as DegreeRecord['names'],
      is_active: r.is_active,
      sort_order: r.sort_order,
    }));
  }
}
