import { Language } from '../types';
import {
  CountryCode,
  DegreeType,
  UniversityCatalog,
  UniversityInfo,
  UNIVERSITY_IDS_BY_COUNTRY,
} from './types';

const catalogs: Record<Language, UniversityCatalog> = {
  en: {
    'de-1': { name: 'Technical University of Munich', city: 'Munich' },
    'de-2': { name: 'Heidelberg University', city: 'Heidelberg' },
    'de-3': { name: 'Humboldt University of Berlin', city: 'Berlin' },
    'hu-1': { name: 'Eötvös Loránd University', city: 'Budapest' },
    'hu-2': { name: 'Budapest University of Technology', city: 'Budapest' },
    'hu-3': { name: 'University of Szeged', city: 'Szeged' },
    'pl-1': { name: 'University of Warsaw', city: 'Warsaw' },
    'pl-2': { name: 'Jagiellonian University', city: 'Kraków' },
    'pl-3': { name: 'Warsaw University of Technology', city: 'Warsaw' },
    'it-1': { name: 'University of Bologna', city: 'Bologna' },
    'it-2': { name: 'Sapienza University of Rome', city: 'Rome' },
    'it-3': { name: 'Politecnico di Milano', city: 'Milan' },
    'tr-1': { name: 'Boğaziçi University', city: 'Istanbul' },
    'tr-2': { name: 'Middle East Technical University', city: 'Ankara' },
    'tr-3': { name: 'Istanbul University', city: 'Istanbul' },
  },
  ru: {
    'de-1': { name: 'Технический университет Мюнхена', city: 'Мюнхен' },
    'de-2': { name: 'Гейдельбергский университет', city: 'Гейдельберг' },
    'de-3': { name: 'Гумбoldtский университет Берлина', city: 'Берлин' },
    'hu-1': { name: 'Будапештский университет Эötvös Loránd', city: 'Будапешт' },
    'hu-2': { name: 'Будапештский технологический университет', city: 'Будапешт' },
    'hu-3': { name: 'Университет Сегеда', city: 'Сегед' },
    'pl-1': { name: 'Варшавский университет', city: 'Варшава' },
    'pl-2': { name: 'Ягеллонский университет', city: 'Краков' },
    'pl-3': { name: 'Варшавский технологический университет', city: 'Варшава' },
    'it-1': { name: 'Болонский университет', city: 'Болонья' },
    'it-2': { name: 'Университет Сапиенца', city: 'Рим' },
    'it-3': { name: 'Политехнический университет Милана', city: 'Милан' },
    'tr-1': { name: 'Богазичский университет', city: 'Стамбул' },
    'tr-2': { name: 'Ближневосточный технический университет', city: 'Анкара' },
    'tr-3': { name: 'Стамбульский университет', city: 'Стамбул' },
  },
  uz: {
    'de-1': { name: 'Myunxen texnika universiteti', city: 'Myunxen' },
    'de-2': { name: 'Haydelberg universiteti', city: 'Haydelberg' },
    'de-3': { name: 'Berlin Humboldt universiteti', city: 'Berlin' },
    'hu-1': { name: 'Eötvös Loránd Budapesht universiteti', city: 'Budapesht' },
    'hu-2': { name: 'Budapesht texnologiya universiteti', city: 'Budapesht' },
    'hu-3': { name: 'Seged universiteti', city: 'Seged' },
    'pl-1': { name: 'Varshava universiteti', city: 'Varshava' },
    'pl-2': { name: 'Yagellon universiteti', city: 'Krakov' },
    'pl-3': { name: 'Varshava texnologiya universiteti', city: 'Varshava' },
    'it-1': { name: 'Bologna universiteti', city: 'Bologna' },
    'it-2': { name: 'Sapienza Rim universiteti', city: 'Rim' },
    'it-3': { name: 'Milano politexnika universiteti', city: 'Milan' },
    'tr-1': { name: 'Boğaziçi universiteti', city: 'Istanbul' },
    'tr-2': { name: 'O\'rta Sharq texnika universiteti', city: 'Ankara' },
    'tr-3': { name: 'Istanbul universiteti', city: 'Istanbul' },
  },
};

export function getUniversityCatalog(language: Language): UniversityCatalog {
  return catalogs[language] ?? catalogs.en;
}

export function getUniversitiesForSelection(
  country: CountryCode,
  _degree: DegreeType,
  language: Language,
): UniversityInfo[] {
  const catalog = getUniversityCatalog(language);
  return UNIVERSITY_IDS_BY_COUNTRY[country].map((id) => ({
    id,
    name: catalog[id]?.name ?? id,
    city: catalog[id]?.city ?? '',
  }));
}

export function getUniversityById(
  universityId: string,
  language: Language,
): UniversityInfo | null {
  const catalog = getUniversityCatalog(language);
  const entry = catalog[universityId];
  if (!entry) return null;

  return {
    id: universityId,
    name: entry.name,
    city: entry.city,
  };
}

export function isValidCountryCode(value: string): value is CountryCode {
  return value in UNIVERSITY_IDS_BY_COUNTRY;
}

export function isValidDegreeType(value: string): value is DegreeType {
  return value === 'bachelor' || value === 'master' || value === 'phd';
}
