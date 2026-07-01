import { Language } from '../types';
import { t } from '../i18n';
import { getUniversityById } from '../universities/university.service';
import { DegreeType } from '../universities/types';
import { getApplicationStatusLabel } from '../services/application-status.service';
import { ApplicationWithStudent } from './types';

export function getDegreeLabel(language: Language, degree: DegreeType): string {
  const texts = t(language);
  const labels: Record<DegreeType, string> = {
    bachelor: texts.degreeBachelor,
    master: texts.degreeMaster,
    phd: texts.degreePhd,
  };
  return labels[degree];
}

export function formatAdminDate(date: Date, language: Language): string {
  const localeMap = { en: 'en-GB', ru: 'ru-RU', uz: 'uz-UZ' } as const;
  return date.toLocaleDateString(localeMap[language], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function formatApplicationAlertSummary(
  application: ApplicationWithStudent,
  language: Language,
): Promise<string> {
  const texts = t(language);
  const university = await getUniversityById(application.university_id, language);

  return texts.managerNewApplicationAlert(
    application.student_name ?? '—',
    application.student_phone ?? '—',
    university?.name ?? application.university_id,
    texts.countries[application.country],
    getDegreeLabel(language, application.degree),
    formatAdminDate(application.created_at, language),
    application.id,
  );
}

export async function formatApplicationSummary(
  application: ApplicationWithStudent,
  language: Language,
): Promise<string> {
  const texts = t(language);
  const university = await getUniversityById(application.university_id, language);

  return texts.adminApplicationEntry(
    application.student_name ?? '—',
    application.student_phone ?? '—',
    university?.name ?? application.university_id,
    texts.countries[application.country],
    getDegreeLabel(language, application.degree),
    getApplicationStatusLabel(language, application.status),
    formatAdminDate(application.created_at, language),
    application.id,
  );
}
