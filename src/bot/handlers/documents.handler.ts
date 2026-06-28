import { AppContext, getLanguage } from '../middleware/context.middleware';
import { t } from '../../i18n';
import { Language } from '../../types';
import {
  applicationSelectionKeyboard,
  documentTypeKeyboard,
  parseApplicationCallback,
  parseDocumentTypeCallback,
  DOC_CANCEL,
} from '../keyboards/documents.keyboard';
import {
  findApplicationById,
  findApplicationsByTelegramId,
} from '../../database/repositories/application.repository';
import {
  createDocument,
  documentExists,
  findDocumentsByTelegramId,
} from '../../database/repositories/document.repository';
import { isDuplicateDocumentError } from '../../database/postgres-errors';
import { getUniversityById } from '../../universities/catalog';
import {
  ALLOWED_MIME_TYPES,
  DocumentStatus,
  MAX_FILE_SIZE_BYTES,
} from '../../documents/types';
import { DegreeType } from '../../universities/types';
import { changeApplicationStatusWithNotification } from '../../services/application.service';
import { logger } from '../../logger';

interface ExtractedFile {
  telegramFileId: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
}

function getDegreeLabel(language: Language, degree: DegreeType): string {
  const texts = t(language);
  const labels: Record<DegreeType, string> = {
    bachelor: texts.degreeBachelor,
    master: texts.degreeMaster,
    phd: texts.degreePhd,
  };
  return labels[degree];
}

function formatDate(date: Date, language: Language): string {
  const localeMap = { en: 'en-GB', ru: 'ru-RU', uz: 'uz-UZ' } as const;
  return date.toLocaleDateString(localeMap[language], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDocumentStatusLabel(language: Language, status: DocumentStatus): string {
  const texts = t(language);
  const labels: Record<DocumentStatus, string> = {
    pending: texts.documentStatusPending,
    verified: texts.documentStatusVerified,
    rejected: texts.documentStatusRejected,
  };
  return labels[status];
}

async function buildApplicationLabel(
  applicationId: number,
  telegramId: number,
  language: Language,
): Promise<string> {
  const application = await findApplicationById(applicationId, telegramId);
  if (!application) return `#${applicationId}`;

  const university = getUniversityById(application.university_id, language);
  const texts = t(language);
  const universityName = university?.name ?? application.university_id;
  const degree = getDegreeLabel(language, application.degree);

  return `${universityName} · ${texts.countries[application.country]} · ${degree}`;
}

function extractFileFromMessage(ctx: AppContext): ExtractedFile | null {
  const message = ctx.message;
  if (!message) return null;

  if ('document' in message && message.document) {
    const doc = message.document;
    return {
      telegramFileId: doc.file_id,
      originalFileName: doc.file_name ?? `document_${doc.file_unique_id}`,
      mimeType: doc.mime_type ?? 'application/octet-stream',
      fileSize: doc.file_size ?? 0,
    };
  }

  if ('photo' in message && message.photo?.length) {
    const photo = message.photo[message.photo.length - 1];
    return {
      telegramFileId: photo.file_id,
      originalFileName: `photo_${photo.file_unique_id}.jpg`,
      mimeType: 'image/jpeg',
      fileSize: photo.file_size ?? 0,
    };
  }

  return null;
}

export function clearDocumentFlow(ctx: AppContext): void {
  ctx.session.documentFlow = null;
}

export async function startDocumentsFlow(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  clearDocumentFlow(ctx);

  const language = getLanguage(ctx);
  const texts = t(language);
  const applications = await findApplicationsByTelegramId(telegramId);

  if (applications.length === 0) {
    await ctx.reply(texts.noApplicationsForDocuments, { parse_mode: 'Markdown' });
    return;
  }

  await ctx.reply(texts.selectApplicationForDocument, {
    parse_mode: 'Markdown',
    ...applicationSelectionKeyboard(applications, language),
  });
}

export async function handleApplicationSelection(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const applicationId = parseApplicationCallback(ctx.callbackQuery.data);
  if (!applicationId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  const application = await findApplicationById(applicationId, telegramId);
  if (!application) {
    await ctx.answerCbQuery(texts.applicationNotFound, { show_alert: true });
    return;
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText(texts.selectDocumentType, {
    parse_mode: 'Markdown',
    ...documentTypeKeyboard(applicationId, language),
  });
}

export async function handleDocumentTypeSelection(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const parsed = parseDocumentTypeCallback(ctx.callbackQuery.data);
  if (!parsed) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  const application = await findApplicationById(parsed.applicationId, telegramId);
  if (!application) {
    await ctx.answerCbQuery(texts.applicationNotFound, { show_alert: true });
    return;
  }

  const exists = await documentExists(
    parsed.applicationId,
    telegramId,
    parsed.documentType,
  );

  if (exists) {
    await ctx.answerCbQuery(texts.documentUploadDuplicate, { show_alert: true });
    return;
  }

  ctx.session.documentFlow = {
    applicationId: parsed.applicationId,
    documentType: parsed.documentType,
  };

  const applicationLabel = await buildApplicationLabel(
    parsed.applicationId,
    telegramId,
    language,
  );
  const documentTypeLabel = texts.documentTypes[parsed.documentType];

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    texts.uploadDocumentPrompt(documentTypeLabel, applicationLabel),
    { parse_mode: 'Markdown' },
  );
}

export async function handleDocumentUpload(ctx: AppContext): Promise<void> {
  if (!ctx.session.documentFlow) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);
  const { applicationId, documentType } = ctx.session.documentFlow;

  try {
    const application = await findApplicationById(applicationId, telegramId);
    if (!application) {
      clearDocumentFlow(ctx);
      await ctx.reply(texts.applicationNotFound);
      return;
    }

    const file = extractFileFromMessage(ctx);
    if (!file) {
      await ctx.reply(texts.pleaseUploadFile);
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
      await ctx.reply(texts.invalidFileType);
      return;
    }

    if (file.fileSize > MAX_FILE_SIZE_BYTES) {
      await ctx.reply(texts.fileTooLarge);
      return;
    }

    const exists = await documentExists(applicationId, telegramId, documentType);
    if (exists) {
      clearDocumentFlow(ctx);
      await ctx.reply(texts.documentUploadDuplicate);
      return;
    }

    await createDocument({
      telegram_id: telegramId,
      application_id: applicationId,
      document_type: documentType,
      telegram_file_id: file.telegramFileId,
      original_file_name: file.originalFileName,
    });

    if (application.status === 'submitted' || application.status === 'documents_required') {
      await changeApplicationStatusWithNotification(applicationId, telegramId, 'reviewing', language);
    }

    clearDocumentFlow(ctx);

    const documentTypeLabel = texts.documentTypes[documentType];
    await ctx.reply(
      texts.documentUploadSuccess(documentTypeLabel, file.originalFileName),
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    if (isDuplicateDocumentError(error)) {
      clearDocumentFlow(ctx);
      await ctx.reply(texts.documentUploadDuplicate);
      return;
    }

    logger.error({ error, telegramId, applicationId, documentType }, 'Document upload failed');
    clearDocumentFlow(ctx);
    await ctx.reply(texts.errorGeneric);
    throw error;
  }
}

export async function handleDocumentUploadText(ctx: AppContext): Promise<boolean> {
  if (!ctx.session.documentFlow) return false;

  const language = getLanguage(ctx);
  const texts = t(language);

  if (ctx.message && 'text' in ctx.message && ctx.message.text === texts.backToMenu) {
    clearDocumentFlow(ctx);
    await ctx.reply(texts.uploadCancelled);
    return true;
  }

  await ctx.reply(texts.pleaseUploadFile);
  return true;
}

export async function handleDocumentCancel(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (ctx.callbackQuery.data !== DOC_CANCEL) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  clearDocumentFlow(ctx);
  await ctx.answerCbQuery();
  await ctx.editMessageText(texts.uploadCancelled);
}

export async function showMyDocuments(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  const documents = await findDocumentsByTelegramId(telegramId);

  if (documents.length === 0) {
    await ctx.reply(texts.noDocumentsYet, { parse_mode: 'Markdown' });
    return;
  }

  const entries = documents
    .map((doc, index) =>
      texts.myDocumentEntry(
        index + 1,
        texts.documentTypes[doc.document_type],
        formatDate(doc.uploaded_at, language),
        getDocumentStatusLabel(language, doc.status),
        doc.original_file_name,
      ),
    )
    .join('\n\n');

  await ctx.reply(`${texts.myDocumentsTitle}\n\n${entries}`, {
    parse_mode: 'Markdown',
  });
}

export function isAwaitingDocumentUpload(ctx: AppContext): boolean {
  return ctx.session.documentFlow !== null;
}
