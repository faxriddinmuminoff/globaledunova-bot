import { Markup } from 'telegraf';
import { Language } from '../../types';
import { t } from '../../i18n';
import { Application } from '../../universities/types';
import { getUniversityById } from '../../universities/catalog';
import {
  DOC_APP_PREFIX,
  DOC_CANCEL,
  DOC_TYPE_PREFIX,
  DOCUMENT_TYPES,
  DocumentType,
} from '../../documents/types';

export function applicationSelectionKeyboard(
  applications: Application[],
  language: Language,
) {
  const texts = t(language);

  const rows = applications.map((app) => {
    const university = getUniversityById(app.university_id, language);
    const label = university
      ? `${university.name} (${texts.countries[app.country]})`
      : `#${app.id}`;

    return [Markup.button.callback(label, `${DOC_APP_PREFIX}${app.id}`)];
  });

  rows.push([Markup.button.callback(texts.cancelUpload, DOC_CANCEL)]);

  return Markup.inlineKeyboard(rows);
}

export function documentTypeKeyboard(applicationId: number, language: Language) {
  const texts = t(language);

  const rows = DOCUMENT_TYPES.map((type) => [
    Markup.button.callback(
      texts.documentTypes[type],
      `${DOC_TYPE_PREFIX}${applicationId}:${type}`,
    ),
  ]);

  rows.push([Markup.button.callback(texts.cancelUpload, DOC_CANCEL)]);

  return Markup.inlineKeyboard(rows);
}

export function parseApplicationCallback(data: string): number | null {
  if (!data.startsWith(DOC_APP_PREFIX)) return null;
  const id = Number(data.slice(DOC_APP_PREFIX.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parseDocumentTypeCallback(
  data: string,
): { applicationId: number; documentType: DocumentType } | null {
  if (!data.startsWith(DOC_TYPE_PREFIX)) return null;

  const payload = data.slice(DOC_TYPE_PREFIX.length);
  const separatorIndex = payload.indexOf(':');
  if (separatorIndex === -1) return null;

  const applicationId = Number(payload.slice(0, separatorIndex));
  const documentType = payload.slice(separatorIndex + 1) as DocumentType;

  if (!Number.isInteger(applicationId) || applicationId <= 0) return null;
  if (!DOCUMENT_TYPES.includes(documentType)) return null;

  return { applicationId, documentType };
}

export { DOC_CANCEL };
