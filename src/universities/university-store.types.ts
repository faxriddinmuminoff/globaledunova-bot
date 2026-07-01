import { Language } from '../types';
import { CountryCode, DegreeType } from './types';
import {
  CountryRecord,
  CreateUniversityInput,
  DegreeRecord,
  UniversityRecord,
  UpdateUniversityInput,
} from './university.types';

export interface UniversityStore {
  findAllActive(): Promise<UniversityRecord[]>;
  findById(id: string): Promise<UniversityRecord | null>;
  findByCountry(countryCode: CountryCode): Promise<UniversityRecord[]>;
  create(input: CreateUniversityInput): Promise<UniversityRecord>;
  update(id: string, input: UpdateUniversityInput): Promise<UniversityRecord | null>;
  archive(id: string): Promise<boolean>;
  findCountries(): Promise<CountryRecord[]>;
  findDegrees(): Promise<DegreeRecord[]>;
  seedDefaults(
    records: UniversityRecord[],
    countries: CountryRecord[],
    degrees: DegreeRecord[],
  ): Promise<void>;
}

export function filterUniversitiesForSelection(
  records: UniversityRecord[],
  country: CountryCode,
  degree: DegreeType,
  language: Language,
): { id: string; name: string; city: string }[] {
  return records
    .filter(
      (u) =>
        !u.is_archived &&
        u.country_code === country &&
        u.supported_degrees.includes(degree),
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((u) => {
      const localized = u.names[language] ?? u.names.en;
      return { id: u.id, name: localized.name, city: localized.city };
    });
}
