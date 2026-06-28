export type CountryCode = 'de' | 'hu' | 'pl' | 'it' | 'tr';

export type DegreeType = 'bachelor' | 'master' | 'phd';

export type DegreeCode = 'ba' | 'ma' | 'phd';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'documents_required'
  | 'sent_to_university'
  | 'accepted'
  | 'rejected'
  | 'visa_processing'
  | 'completed';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'draft',
  'submitted',
  'reviewing',
  'documents_required',
  'sent_to_university',
  'accepted',
  'rejected',
  'visa_processing',
  'completed',
];

export interface UniversityInfo {
  id: string;
  name: string;
  city: string;
}

export interface Application {
  id: number;
  telegram_id: number;
  university_id: string;
  country: CountryCode;
  degree: DegreeType;
  status: ApplicationStatus;
  created_at: Date;
  updated_at: Date;
}

export interface UniversityCatalogEntry {
  name: string;
  city: string;
}

export type UniversityCatalog = Record<string, UniversityCatalogEntry>;

export const COUNTRY_CODES: CountryCode[] = ['de', 'hu', 'pl', 'it', 'tr'];

export const DEGREE_TYPES: DegreeType[] = ['bachelor', 'master', 'phd'];

export const DEGREE_CODE_MAP: Record<DegreeCode, DegreeType> = {
  ba: 'bachelor',
  ma: 'master',
  phd: 'phd',
};

export const DEGREE_TO_CODE: Record<DegreeType, DegreeCode> = {
  bachelor: 'ba',
  master: 'ma',
  phd: 'phd',
};

export const UNIVERSITY_IDS_BY_COUNTRY: Record<CountryCode, string[]> = {
  de: ['de-1', 'de-2', 'de-3'],
  hu: ['hu-1', 'hu-2', 'hu-3'],
  pl: ['pl-1', 'pl-2', 'pl-3'],
  it: ['it-1', 'it-2', 'it-3'],
  tr: ['tr-1', 'tr-2', 'tr-3'],
};

export const UNI_COUNTRY_PREFIX = 'uc:';
export const UNI_DEGREE_PREFIX = 'ud:';
export const UNI_APPLY_PREFIX = 'ua:';
export const UNI_BACK_COUNTRIES = 'ub:c';
export const UNI_BACK_DEGREES_PREFIX = 'ub:d:';
