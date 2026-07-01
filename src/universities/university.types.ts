import { Language } from '../types';
import { CountryCode, DegreeType } from './types';

export interface UniversityRecord {
  id: string;
  country_code: CountryCode;
  names: Record<Language, { name: string; city: string }>;
  supported_degrees: DegreeType[];
  logo_storage_key: string | null;
  is_archived: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CountryRecord {
  code: CountryCode;
  names: Record<Language, string>;
  is_active: boolean;
  sort_order: number;
}

export interface DegreeRecord {
  code: DegreeType;
  names: Record<Language, string>;
  is_active: boolean;
  sort_order: number;
}

export interface CreateUniversityInput {
  id: string;
  countryCode: CountryCode;
  names: Record<Language, { name: string; city: string }>;
  supportedDegrees?: DegreeType[];
  logoStorageKey?: string | null;
  sortOrder?: number;
}

export interface UpdateUniversityInput {
  names?: Record<Language, { name: string; city: string }>;
  supportedDegrees?: DegreeType[];
  logoStorageKey?: string | null;
  isArchived?: boolean;
  sortOrder?: number;
}

export function toUniversityInfo(
  record: UniversityRecord,
  language: Language,
): { id: string; name: string; city: string } {
  const localized = record.names[language] ?? record.names.en;
  return { id: record.id, name: localized.name, city: localized.city };
}
