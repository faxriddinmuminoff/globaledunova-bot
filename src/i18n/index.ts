import { Language, Translations } from '../types';
import { en } from './locales/en';
import { ru } from './locales/ru';
import { uz } from './locales/uz';

const translations: Record<Language, Translations> = {
  en,
  ru,
  uz,
};

export function t(language: Language): Translations {
  return translations[language] ?? translations.en;
}

export function getLanguageLabel(language: Language): string {
  return translations.en.languages[language];
}

export type { Translations };
