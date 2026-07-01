import { Language } from '../types';
import { CountryCode, DegreeType, UniversityInfo } from './types';
import { getUniversityStore } from '../database/storage';
import {
  CreateUniversityInput,
  toUniversityInfo,
  UpdateUniversityInput,
} from './university.types';
import { filterUniversitiesForSelection } from './university-store.types';

export async function getUniversityById(
  universityId: string,
  language: Language,
): Promise<UniversityInfo | null> {
  const record = await getUniversityStore().findById(universityId);
  if (!record || record.is_archived) return null;
  return toUniversityInfo(record, language);
}

export async function getUniversitiesForSelection(
  country: CountryCode,
  degree: DegreeType,
  language: Language,
): Promise<UniversityInfo[]> {
  const records = await getUniversityStore().findByCountry(country);
  return filterUniversitiesForSelection(records, country, degree, language);
}

export async function getActiveCountries(language: Language): Promise<{ code: CountryCode; name: string }[]> {
  const countries = await getUniversityStore().findCountries();
  return countries
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ code: c.code, name: c.names[language] ?? c.names.en }));
}

export async function createUniversity(input: CreateUniversityInput) {
  return getUniversityStore().create(input);
}

export async function updateUniversity(id: string, input: UpdateUniversityInput) {
  return getUniversityStore().update(id, input);
}

export async function archiveUniversity(id: string): Promise<boolean> {
  return getUniversityStore().archive(id);
}

export function isValidCountryCode(value: string): value is CountryCode {
  return ['de', 'hu', 'pl', 'it', 'tr'].includes(value);
}

export function isValidDegreeType(value: string): value is DegreeType {
  return ['bachelor', 'master', 'phd'].includes(value);
}

export async function getAllUniversityIds(): Promise<string[]> {
  const records = await getUniversityStore().findAllActive();
  return records.map((r) => r.id);
}
