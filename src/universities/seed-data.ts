import { CountryRecord, DegreeRecord, UniversityRecord } from './university.types';
import { CountryCode } from './types';

const now = new Date();

export const SEED_COUNTRIES: CountryRecord[] = [
  { code: 'de', names: { en: 'Germany', ru: 'Германия', uz: 'Germaniya' }, is_active: true, sort_order: 1 },
  { code: 'hu', names: { en: 'Hungary', ru: 'Венгрия', uz: 'Vengriya' }, is_active: true, sort_order: 2 },
  { code: 'pl', names: { en: 'Poland', ru: 'Польша', uz: 'Polsha' }, is_active: true, sort_order: 3 },
  { code: 'it', names: { en: 'Italy', ru: 'Италия', uz: 'Italiya' }, is_active: true, sort_order: 4 },
  { code: 'tr', names: { en: 'Turkey', ru: 'Турция', uz: 'Turkiya' }, is_active: true, sort_order: 5 },
];

export const SEED_DEGREES: DegreeRecord[] = [
  { code: 'bachelor', names: { en: 'Bachelor', ru: 'Бакалавр', uz: 'Bakalavr' }, is_active: true, sort_order: 1 },
  { code: 'master', names: { en: 'Master', ru: 'Магистр', uz: 'Magistr' }, is_active: true, sort_order: 2 },
  { code: 'phd', names: { en: 'PhD', ru: 'Докторант', uz: 'PhD' }, is_active: true, sort_order: 3 },
];

function uni(
  id: string,
  country: CountryCode,
  names: UniversityRecord['names'],
  sortOrder: number,
): UniversityRecord {
  return {
    id,
    country_code: country,
    names,
    supported_degrees: ['bachelor', 'master', 'phd'],
    logo_storage_key: null,
    is_archived: false,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };
}

export const SEED_UNIVERSITIES: UniversityRecord[] = [
  uni('de-1', 'de', {
    en: { name: 'Technical University of Munich', city: 'Munich' },
    ru: { name: 'Технический университет Мюнхена', city: 'Мюнхен' },
    uz: { name: 'Myunxen texnika universiteti', city: 'Myunxen' },
  }, 1),
  uni('de-2', 'de', {
    en: { name: 'Heidelberg University', city: 'Heidelberg' },
    ru: { name: 'Гейдельбергский университет', city: 'Гейдельберг' },
    uz: { name: 'Haydelberg universiteti', city: 'Haydelberg' },
  }, 2),
  uni('de-3', 'de', {
    en: { name: 'Humboldt University of Berlin', city: 'Berlin' },
    ru: { name: 'Гумбoldtский университет Берлина', city: 'Берлин' },
    uz: { name: 'Berlin Humboldt universiteti', city: 'Berlin' },
  }, 3),
  uni('hu-1', 'hu', {
    en: { name: 'Eötvös Loránd University', city: 'Budapest' },
    ru: { name: 'Будапештский университет Эötvös Loránd', city: 'Будапешт' },
    uz: { name: 'Eötvös Loránd Budapesht universiteti', city: 'Budapesht' },
  }, 1),
  uni('hu-2', 'hu', {
    en: { name: 'Budapest University of Technology', city: 'Budapest' },
    ru: { name: 'Будапештский технологический университет', city: 'Будапешт' },
    uz: { name: 'Budapesht texnologiya universiteti', city: 'Budapesht' },
  }, 2),
  uni('hu-3', 'hu', {
    en: { name: 'University of Szeged', city: 'Szeged' },
    ru: { name: 'Университет Сегеда', city: 'Сегед' },
    uz: { name: 'Seged universiteti', city: 'Seged' },
  }, 3),
  uni('pl-1', 'pl', {
    en: { name: 'University of Warsaw', city: 'Warsaw' },
    ru: { name: 'Варшавский университет', city: 'Варшава' },
    uz: { name: 'Varshava universiteti', city: 'Varshava' },
  }, 1),
  uni('pl-2', 'pl', {
    en: { name: 'Jagiellonian University', city: 'Kraków' },
    ru: { name: 'Ягеллонский университет', city: 'Краков' },
    uz: { name: 'Yagellon universiteti', city: 'Krakov' },
  }, 2),
  uni('pl-3', 'pl', {
    en: { name: 'Warsaw University of Technology', city: 'Warsaw' },
    ru: { name: 'Варшавский технологический университет', city: 'Варшава' },
    uz: { name: 'Varshava texnologiya universiteti', city: 'Varshava' },
  }, 3),
  uni('it-1', 'it', {
    en: { name: 'University of Bologna', city: 'Bologna' },
    ru: { name: 'Болонский университет', city: 'Болонья' },
    uz: { name: 'Bologna universiteti', city: 'Bologna' },
  }, 1),
  uni('it-2', 'it', {
    en: { name: 'Sapienza University of Rome', city: 'Rome' },
    ru: { name: 'Университет Сапиенца', city: 'Рим' },
    uz: { name: 'Sapienza Rim universiteti', city: 'Rim' },
  }, 2),
  uni('it-3', 'it', {
    en: { name: 'Politecnico di Milano', city: 'Milan' },
    ru: { name: 'Политехнический университет Милана', city: 'Милан' },
    uz: { name: 'Milano politexnika universiteti', city: 'Milan' },
  }, 3),
  uni('tr-1', 'tr', {
    en: { name: 'Boğaziçi University', city: 'Istanbul' },
    ru: { name: 'Богазичский университет', city: 'Стамбул' },
    uz: { name: 'Boğaziçi universiteti', city: 'Istanbul' },
  }, 1),
  uni('tr-2', 'tr', {
    en: { name: 'Middle East Technical University', city: 'Ankara' },
    ru: { name: 'Ближневосточный технический университет', city: 'Анкара' },
    uz: { name: "O'rta Sharq texnika universiteti", city: 'Ankara' },
  }, 2),
  uni('tr-3', 'tr', {
    en: { name: 'Istanbul University', city: 'Istanbul' },
    ru: { name: 'Стамбульский университет', city: 'Стамбул' },
    uz: { name: 'Istanbul universiteti', city: 'Istanbul' },
  }, 3),
];

export function getAllUniversityIds(): string[] {
  return SEED_UNIVERSITIES.map((u) => u.id);
}
