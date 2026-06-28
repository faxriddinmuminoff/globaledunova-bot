import { Markup } from 'telegraf';
import { Language } from '../../types';
import { t } from '../../i18n';
import {
  COUNTRY_CODES,
  CountryCode,
  DegreeCode,
  DegreeType,
  DEGREE_TO_CODE,
  UNI_APPLY_PREFIX,
  UNI_BACK_COUNTRIES,
  UNI_BACK_DEGREES_PREFIX,
  UNI_COUNTRY_PREFIX,
  UNI_DEGREE_PREFIX,
  UniversityInfo,
} from '../../universities/types';

export function countrySelectionKeyboard(language: Language) {
  const texts = t(language);

  const rows = COUNTRY_CODES.map((code) => [
    Markup.button.callback(texts.countries[code], `${UNI_COUNTRY_PREFIX}${code}`),
  ]);

  return Markup.inlineKeyboard(rows);
}

export function degreeSelectionKeyboard(country: CountryCode, language: Language) {
  const texts = t(language);

  return Markup.inlineKeyboard([
    [Markup.button.callback(texts.degreeBachelor, `${UNI_DEGREE_PREFIX}${country}:ba`)],
    [Markup.button.callback(texts.degreeMaster, `${UNI_DEGREE_PREFIX}${country}:ma`)],
    [Markup.button.callback(texts.degreePhd, `${UNI_DEGREE_PREFIX}${country}:phd`)],
    [Markup.button.callback(texts.backToCountries, UNI_BACK_COUNTRIES)],
  ]);
}

export function universitiesListKeyboard(
  country: CountryCode,
  degree: DegreeType,
  universities: UniversityInfo[],
  language: Language,
) {
  const texts = t(language);
  const degreeCode = DEGREE_TO_CODE[degree];

  const applyRows = universities.map((uni, index) => [
    Markup.button.callback(
      `${texts.applyButton} — ${index + 1}. ${uni.name}`,
      `${UNI_APPLY_PREFIX}${country}:${degreeCode}:${uni.id}`,
    ),
  ]);

  return Markup.inlineKeyboard([
    ...applyRows,
    [Markup.button.callback(texts.backToDegrees, `${UNI_BACK_DEGREES_PREFIX}${country}`)],
    [Markup.button.callback(texts.backToCountries, UNI_BACK_COUNTRIES)],
  ]);
}

export function parseCountryCallback(data: string): CountryCode | null {
  if (!data.startsWith(UNI_COUNTRY_PREFIX)) return null;
  const country = data.slice(UNI_COUNTRY_PREFIX.length);
  if (!COUNTRY_CODES.includes(country as CountryCode)) return null;
  return country as CountryCode;
}

export function parseDegreeCallback(
  data: string,
): { country: CountryCode; degree: DegreeType } | null {
  if (!data.startsWith(UNI_DEGREE_PREFIX)) return null;

  const parts = data.slice(UNI_DEGREE_PREFIX.length).split(':');
  if (parts.length !== 2) return null;

  const [country, degreeCode] = parts;
  if (!COUNTRY_CODES.includes(country as CountryCode)) return null;

  const degreeMap: Record<string, DegreeType> = {
    ba: 'bachelor',
    ma: 'master',
    phd: 'phd',
  };

  const degree = degreeMap[degreeCode];
  if (!degree) return null;

  return { country: country as CountryCode, degree };
}

export function parseApplyCallback(
  data: string,
): { country: CountryCode; degree: DegreeType; universityId: string } | null {
  if (!data.startsWith(UNI_APPLY_PREFIX)) return null;

  const parts = data.slice(UNI_APPLY_PREFIX.length).split(':');
  if (parts.length !== 3) return null;

  const [country, degreeCode, universityId] = parts;
  if (!COUNTRY_CODES.includes(country as CountryCode)) return null;

  const degreeMap: Record<DegreeCode, DegreeType> = {
    ba: 'bachelor',
    ma: 'master',
    phd: 'phd',
  };

  const degree = degreeMap[degreeCode as DegreeCode];
  if (!degree) return null;

  return { country: country as CountryCode, degree, universityId };
}

export function parseBackToDegreesCallback(data: string): CountryCode | null {
  if (!data.startsWith(UNI_BACK_DEGREES_PREFIX)) return null;
  const country = data.slice(UNI_BACK_DEGREES_PREFIX.length);
  if (!COUNTRY_CODES.includes(country as CountryCode)) return null;
  return country as CountryCode;
}
