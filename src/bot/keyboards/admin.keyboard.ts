import { Markup } from 'telegraf';
import { Language } from '../../types';
import { t } from '../../i18n';
import {
  ADMIN_ACCEPT_PREFIX,
  ADMIN_DOC_REQ_PREFIX,
  ADMIN_REJECT_PREFIX,
  ADMIN_VIEW_PREFIX,
  ADMIN_DOC_OPEN_PREFIX,
  ADMIN_DOC_VERIFY_PREFIX,
  ADMIN_DOC_REJECT_PREFIX,
  ADMIN_SEARCH_PHONE,
  ADMIN_SEARCH_TGID,
  ADMIN_SEARCH_NAME,
  ADMIN_SEARCH_APP_ID,
  ADMIN_SEARCH_UNI,
  ADMIN_SEARCH_STATUS,
} from '../../admin/types';
import { Document } from '../../documents/types';

export function adminMenuKeyboard(language: Language) {
  const texts = t(language);

  return Markup.keyboard([
    [texts.adminNewApplications],
    [texts.adminDocuments, texts.adminStudents],
    [texts.adminDashboard, texts.adminStatistics],
    [texts.adminIncidents],
    [texts.adminSettings, texts.adminUniversities],
    [texts.adminBroadcasts, texts.adminBackups],
    [texts.adminSearch],
    [texts.adminBack],
  ]).resize();
}

export function applicationActionKeyboard(applicationId: number, language: Language) {
  const texts = t(language);

  return Markup.inlineKeyboard([
    [
      Markup.button.callback(texts.adminViewButton, `${ADMIN_VIEW_PREFIX}${applicationId}`),
      Markup.button.callback(texts.adminAcceptButton, `${ADMIN_ACCEPT_PREFIX}${applicationId}`),
    ],
    [
      Markup.button.callback(
        texts.adminRequestDocumentsButton,
        `${ADMIN_DOC_REQ_PREFIX}${applicationId}`,
      ),
      Markup.button.callback(texts.adminRejectButton, `${ADMIN_REJECT_PREFIX}${applicationId}`),
    ],
  ]);
}

export function documentReviewKeyboard(documents: Document[], language: Language) {
  const texts = t(language);
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];

  for (const doc of documents) {
    const typeLabel = texts.documentTypes[doc.document_type];
    rows.push([
      Markup.button.callback(`${texts.adminDocOpenButton} ${typeLabel}`, `${ADMIN_DOC_OPEN_PREFIX}${doc.id}`),
      Markup.button.callback(texts.adminDocVerifyButton, `${ADMIN_DOC_VERIFY_PREFIX}${doc.id}`),
      Markup.button.callback(texts.adminDocRejectButton, `${ADMIN_DOC_REJECT_PREFIX}${doc.id}`),
    ]);
  }

  return Markup.inlineKeyboard(rows);
}

export function applicationDetailKeyboard(
  applicationId: number,
  documents: Document[],
  language: Language,
) {
  const appKeyboard = applicationActionKeyboard(applicationId, language);
  const docKeyboard = documentReviewKeyboard(documents, language);

  return Markup.inlineKeyboard([
    ...appKeyboard.reply_markup.inline_keyboard,
    ...docKeyboard.reply_markup.inline_keyboard,
  ]);
}

export function adminSearchTypeKeyboard(language: Language) {
  const texts = t(language);

  return Markup.inlineKeyboard([
    [Markup.button.callback(texts.adminSearchByPhone, ADMIN_SEARCH_PHONE)],
    [Markup.button.callback(texts.adminSearchByTelegramId, ADMIN_SEARCH_TGID)],
    [Markup.button.callback(texts.adminSearchByName, ADMIN_SEARCH_NAME)],
    [Markup.button.callback(texts.adminSearchByApplicationId, ADMIN_SEARCH_APP_ID)],
    [Markup.button.callback(texts.adminSearchByUniversity, ADMIN_SEARCH_UNI)],
    [Markup.button.callback(texts.adminSearchByStatus, ADMIN_SEARCH_STATUS)],
  ]);
}

export function parseAdminApplicationCallback(
  data: string,
  prefix: string,
): number | null {
  if (!data.startsWith(prefix)) return null;
  const id = Number(data.slice(prefix.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parseAdminDocumentCallback(data: string, prefix: string): number | null {
  return parseAdminApplicationCallback(data, prefix);
}

export function getAdminMenuTexts(language: Language): string[] {
  const texts = t(language);
  return [
    texts.adminNewApplications,
    texts.adminDocuments,
    texts.adminStudents,
    texts.adminStatistics,
    texts.adminDashboard,
    texts.adminIncidents,
    texts.adminSettings,
    texts.adminUniversities,
    texts.adminBroadcasts,
    texts.adminBackups,
    texts.adminSearch,
    texts.adminBack,
  ];
}
