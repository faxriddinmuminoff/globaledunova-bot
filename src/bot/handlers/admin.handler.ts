import { AppContext, getLanguage } from '../middleware/context.middleware';
import { isAdmin } from '../helpers/admin.helper';
import {
  adminMenuKeyboard,
  adminSearchTypeKeyboard,
  applicationActionKeyboard,
  applicationDetailKeyboard,
  documentReviewKeyboard,
  getAdminMenuTexts,
  parseAdminApplicationCallback,
  parseAdminDocumentCallback,
} from '../keyboards/admin.keyboard';
import { mainMenuKeyboardForUser } from '../helpers/menu.helper';
import { t, getLanguageLabel } from '../../i18n';
import { Language, OnboardingStep, User } from '../../types';
import {
  findRecentApplicationsWithStudent,
  findApplicationWithStudentById,
  findRecentDocumentsWithStudent,
  findRecentStudents,
  getAdminStatistics,
} from '../../database/repositories/admin.repository';
import { findDocumentsByApplicationId } from '../../database/repositories/document.repository';
import { adminChangeApplicationStatus } from '../../services/admin-application.service';
import {
  adminVerifyDocument,
  adminRejectDocument,
  getDocumentForAdminOpen,
} from '../../services/admin-document.service';
import { getApplicationStatusLabel } from '../../services/application-status.service';
import { getUniversityById } from '../../universities/university.service';
import { DocumentStatus } from '../../documents/types';
import {
  ADMIN_ACCEPT_PREFIX,
  ADMIN_DOC_REQ_PREFIX,
  ADMIN_REJECT_PREFIX,
  ADMIN_VIEW_PREFIX,
  ADMIN_DOC_OPEN_PREFIX,
  ADMIN_DOC_VERIFY_PREFIX,
  ADMIN_DOC_REJECT_PREFIX,
  AdminSearchMode,
  ApplicationWithStudent,
} from '../../admin/types';
import {
  formatApplicationSummary,
  formatAdminDate,
  getDegreeLabel,
} from '../../admin/formatters';
import { buildRequirementChecklist } from '../../services/requirement.service';
import { formatChecklistLine } from '../../admin/document-checklist';
import {
  executeAdminSearch,
  formatUserSearchResults,
  formatApplicationSearchResults,
  isUserSearchMode,
} from '../../services/admin-search.service';
import { PaginatedResult } from '../../types/requirements';
import { searchPaginationKeyboard } from '../keyboards/admin-enterprise.keyboard';
import {
  handleAdminSettingsMenu,
  handleAdminUniversitiesMenu,
  handleAdminBroadcastsMenu,
  handleAdminBackupsMenu,
  handleAdminLoginAudit,
  handleAdminIncidentsMenu,
  handleAdminAnalyticsDashboard,
} from './admin-enterprise.handler';
import { openDocumentForAdmin } from '../../services/document-viewer.service';
import { getApplicationTimeline } from '../../services/application-timeline.service';
import { logger } from '../../logger';
import { hasPermission } from '../../rbac/rbac.service';

function getDocumentStatusLabel(language: Language, status: DocumentStatus): string {
  const texts = t(language);
  const labels: Record<DocumentStatus, string> = {
    pending: texts.documentStatusPending,
    verified: texts.documentStatusVerified,
    rejected: texts.documentStatusRejected,
  };
  return labels[status];
}

async function buildApplicationDetailMessage(
  application: ApplicationWithStudent,
  language: Language,
): Promise<string> {
  const texts = t(language);
  const university = await getUniversityById(application.university_id, language);
  const documents = await findDocumentsByApplicationId(application.id);
  const checklistItems = await buildRequirementChecklist(application.university_id, documents);
  const timeline = await getApplicationTimeline(application.id);

  const timelineText =
    timeline.length === 0
      ? texts.appNoTimeline
      : timeline
          .map((event) => {
            const fromLabel = event.from_status
              ? getApplicationStatusLabel(language, event.from_status)
              : '—';
            const toLabel = event.to_status
              ? getApplicationStatusLabel(language, event.to_status)
              : '—';
            return texts.appTimelineEntry(
              formatAdminDate(event.created_at, language),
              fromLabel,
              toLabel,
            );
          })
          .join('\n');

  const checklist = checklistItems.map((item) => formatChecklistLine(language, item)).join('\n');

  const uploaded =
    documents.length === 0
      ? texts.adminNoUploadedDocuments
      : documents
          .map((doc) => `• ${texts.documentTypes[doc.document_type]} — ${doc.original_file_name}`)
          .join('\n');

  const missing =
    checklistItems.filter((i) => i.state === 'missing').length === 0
      ? texts.adminAllDocumentsUploaded
      : checklistItems
          .filter((i) => i.state === 'missing')
          .map((i) => `❌ ${texts.documentTypes[i.documentType]}`)
          .join('\n');

  const header = texts.adminApplicationDetails(
    application.id,
    application.student_name ?? '—',
    application.student_phone ?? '—',
    application.telegram_id,
    university?.name ?? application.university_id,
    texts.countries[application.country],
    getDegreeLabel(language, application.degree),
    getApplicationStatusLabel(language, application.status),
    formatAdminDate(application.created_at, language),
    formatAdminDate(application.updated_at, language),
  );

  return [
    header,
    '',
    texts.adminDocumentChecklistTitle,
    checklist,
    '',
    `📅 *Timeline:*\n${timelineText}`,
    '',
    texts.adminUploadedDocsTitle,
    uploaded,
    '',
    texts.adminMissingDocsTitle,
    missing,
  ].join('\n');
}

export async function handleAdminCommand(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  if (!isAdmin(telegramId)) {
    await ctx.reply(texts.adminUnauthorized);
    return;
  }

  ctx.session.adminMode = true;
  ctx.session.adminSearchMode = null;
  ctx.session.adminSearchQuery = null;
  ctx.session.adminSearchPage = 1;
  ctx.session.adminWizard = null;
  await handleAdminLoginAudit(ctx);
  await ctx.reply(texts.adminMenu, adminMenuKeyboard(language));
}

export async function handleAdminMenuAction(ctx: AppContext): Promise<void> {
  if (!ctx.message || !('text' in ctx.message)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId || !isAdmin(telegramId)) {
    ctx.session.adminMode = false;
    ctx.session.adminSearchMode = null;
    return;
  }

  const language = getLanguage(ctx);
  const texts = t(language);
  const text = ctx.message.text;
  const menuTexts = getAdminMenuTexts(language);

  if (!menuTexts.includes(text)) return;

  ctx.session.adminSearchMode = null;

  if (text === texts.adminNewApplications) {
    await showNewApplications(ctx);
    return;
  }

  if (text === texts.adminDocuments) {
    await showAdminDocuments(ctx);
    return;
  }

  if (text === texts.adminStudents) {
    await showAdminStudents(ctx);
    return;
  }

  if (text === texts.adminStatistics) {
    await showAdminStatistics(ctx);
    return;
  }

  if (text === texts.adminDashboard) {
    await handleAdminAnalyticsDashboard(ctx, 'today');
    return;
  }

  if (text === texts.adminIncidents) {
    await handleAdminIncidentsMenu(ctx);
    return;
  }

  if (text === texts.adminSearch) {
    await ctx.reply(texts.adminSearchTitle, adminSearchTypeKeyboard(language));
    return;
  }

  if (text === texts.adminSettings) {
    await handleAdminSettingsMenu(ctx);
    return;
  }

  if (text === texts.adminUniversities) {
    await handleAdminUniversitiesMenu(ctx);
    return;
  }

  if (text === texts.adminBroadcasts) {
    await handleAdminBroadcastsMenu(ctx);
    return;
  }

  if (text === texts.adminBackups) {
    await handleAdminBackupsMenu(ctx);
    return;
  }

  if (text === texts.adminBack) {
    await handleAdminBack(ctx);
  }
}

export async function handleAdminSearchInput(ctx: AppContext): Promise<boolean> {
  if (!ctx.message || !('text' in ctx.message)) return false;
  if (!ctx.session.adminSearchMode) return false;

  const telegramId = ctx.from?.id;
  if (!telegramId || !isAdmin(telegramId)) {
    ctx.session.adminSearchMode = null;
    return false;
  }

  const language = getLanguage(ctx);
  const texts = t(language);
  const query = ctx.message.text.trim();

  if (query === texts.adminBack) {
    ctx.session.adminSearchMode = null;
    ctx.session.adminSearchQuery = null;
    ctx.session.adminSearchPage = 1;
    await ctx.reply(texts.adminMenu, adminMenuKeyboard(language));
    return true;
  }

  if (ctx.session.adminSearchMode === 'telegram_id') {
    const id = Number(query);
    if (!Number.isInteger(id) || id <= 0) {
      await ctx.reply(texts.adminSearchInvalidTelegramId);
      return true;
    }
  }

  ctx.session.adminSearchQuery = query;
  ctx.session.adminSearchPage = 1;
  await replyAdminSearchPage(ctx, 1);
  return true;
}

export async function handleAdminSearchPage(ctx: AppContext, direction: 'prev' | 'next'): Promise<void> {
  if (!ctx.callbackQuery) return;
  if (!isAdmin(ctx.from?.id)) {
    await ctx.answerCbQuery();
    return;
  }

  const mode = ctx.session.adminSearchMode;
  const query = ctx.session.adminSearchQuery;
  if (!mode || !query) {
    await ctx.answerCbQuery();
    return;
  }

  const current = ctx.session.adminSearchPage ?? 1;
  const nextPage = direction === 'prev' ? current - 1 : current + 1;
  ctx.session.adminSearchPage = Math.max(1, nextPage);

  await ctx.answerCbQuery();
  await replyAdminSearchPage(ctx, ctx.session.adminSearchPage, true);
}

async function replyAdminSearchPage(
  ctx: AppContext,
  page: number,
  edit = false,
): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);
  const mode = ctx.session.adminSearchMode;
  const query = ctx.session.adminSearchQuery;
  if (!mode || !query) return;

  const paginated = await executeAdminSearch(mode, query, page);

  if (paginated.total === 0) {
    const payload = { parse_mode: 'Markdown' as const };
    if (edit && ctx.callbackQuery?.message && 'text' in ctx.callbackQuery.message) {
      await ctx.editMessageText(texts.adminSearchNoResults, payload);
    } else {
      await ctx.reply(texts.adminSearchNoResults, payload);
    }
    return;
  }

  const message = isUserSearchMode(mode)
    ? formatUserSearchResults(language, paginated.items as User[], paginated as PaginatedResult<User>)
    : await formatApplicationSearchResults(
        language,
        paginated.items as ApplicationWithStudent[],
        paginated as PaginatedResult<ApplicationWithStudent>,
      );

  const keyboard = searchPaginationKeyboard(language, paginated.page, paginated.totalPages);
  const extra = {
    parse_mode: 'Markdown' as const,
    ...(keyboard ? keyboard : {}),
  };

  if (edit && ctx.callbackQuery?.message && 'text' in ctx.callbackQuery.message) {
    await ctx.editMessageText(message, extra);
  } else {
    await ctx.reply(message, extra);
  }
}

export async function handleAdminSearchType(ctx: AppContext, mode: AdminSearchMode): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (!isAdmin(ctx.from?.id) || !(await hasPermission(ctx.from?.id ?? 0, 'applications:view'))) {
    await ctx.answerCbQuery();
    return;
  }

  const language = getLanguage(ctx);
  const texts = t(language);

  ctx.session.adminMode = true;
  ctx.session.adminSearchMode = mode;

  const prompt =
    mode === 'phone'
      ? texts.adminSearchPromptPhone
      : mode === 'telegram_id'
        ? texts.adminSearchPromptTelegramId
        : mode === 'name'
          ? texts.adminSearchPromptName
          : mode === 'application_id'
            ? texts.adminSearchPromptApplicationId
            : mode === 'university'
              ? texts.adminSearchPromptUniversity
              : texts.adminSearchPromptStatus;

  await ctx.answerCbQuery();
  await ctx.editMessageText(prompt, { parse_mode: 'Markdown' });
}

async function handleAdminBack(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  ctx.session.adminMode = false;
  ctx.session.adminSearchMode = null;

  if (ctx.session.onboardingStep === OnboardingStep.Complete) {
    await ctx.reply(texts.mainMenu, await mainMenuKeyboardForUser(language, telegramId));
    return;
  }

  await ctx.reply(texts.adminBackToBot);
}

export async function showNewApplications(ctx: AppContext): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);

  const applications = await findRecentApplicationsWithStudent(20);

  if (applications.length === 0) {
    await ctx.reply(texts.adminNoApplications, { parse_mode: 'Markdown' });
    return;
  }

  await ctx.reply(texts.adminNewApplicationsTitle(applications.length), {
    parse_mode: 'Markdown',
  });

  for (const application of applications) {
    await ctx.reply(await formatApplicationSummary(application, language), {
      parse_mode: 'Markdown',
      ...applicationActionKeyboard(application.id, language),
    });
  }
}

async function showAdminDocuments(ctx: AppContext): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);

  const documents = await findRecentDocumentsWithStudent(20);

  if (documents.length === 0) {
    await ctx.reply(texts.adminNoDocuments, { parse_mode: 'Markdown' });
    return;
  }

  await ctx.reply(texts.adminDocumentsTitle, { parse_mode: 'Markdown' });

  for (const [index, doc] of documents.entries()) {
    const entry = texts.adminDocumentEntry(
      index + 1,
      doc.student_name ?? '—',
      texts.documentTypes[doc.document_type],
      doc.original_file_name,
      getDocumentStatusLabel(language, doc.status),
      formatAdminDate(doc.uploaded_at, language),
      doc.application_id,
    );

    await ctx.reply(entry, {
      parse_mode: 'Markdown',
      ...documentReviewKeyboard([doc], language),
    });
  }
}

async function showAdminStudents(ctx: AppContext): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);

  const students = await findRecentStudents(20);

  if (students.length === 0) {
    await ctx.reply(texts.adminNoStudents, { parse_mode: 'Markdown' });
    return;
  }

  const entries = students
    .map((student, index) =>
      texts.adminStudentEntry(
        index + 1,
        student.full_name ?? '—',
        student.phone_number ?? '—',
        getLanguageLabel(student.language),
        formatAdminDate(student.created_at, language),
        student.telegram_id,
      ),
    )
    .join('\n\n');

  await ctx.reply(`${texts.adminStudentsTitle}\n\n${entries}`, {
    parse_mode: 'Markdown',
  });
}

async function showAdminStatistics(ctx: AppContext): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);

  const stats = await getAdminStatistics();

  const topCountries = stats.topCountries
    .map((item) => {
      const countryLabel =
        item.country in texts.countries
          ? texts.countries[item.country as keyof typeof texts.countries]
          : item.country;
      return `• ${countryLabel}: ${item.count}`;
    })
    .join('\n');

  const topUniversities = (
    await Promise.all(
      stats.topUniversities.map(async (item) => {
        const uni = await getUniversityById(item.universityId, language);
        return `• ${uni?.name ?? item.universityId}: ${item.count}`;
      }),
    )
  ).join('\n');

  await ctx.reply(
    texts.adminStatisticsText(
      stats.totalUsers,
      stats.totalApplications,
      stats.totalDocuments,
      stats.pendingReviewApplications,
      stats.acceptedApplications,
      stats.rejectedApplications,
      stats.documentsRequiredApplications,
      stats.pendingDocuments,
      topCountries || '—',
      topUniversities || '—',
    ),
    { parse_mode: 'Markdown' },
  );
}

export async function handleAdminView(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (!isAdmin(ctx.from?.id) || !(await hasPermission(ctx.from?.id ?? 0, 'applications:view'))) {
    await ctx.answerCbQuery();
    return;
  }

  const applicationId = parseAdminApplicationCallback(
    ctx.callbackQuery.data,
    ADMIN_VIEW_PREFIX,
  );
  if (!applicationId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  const application = await findApplicationWithStudentById(applicationId);
  if (!application) {
    await ctx.answerCbQuery(texts.adminApplicationNotFound, { show_alert: true });
    return;
  }

  const documents = await findDocumentsByApplicationId(applicationId);
  const message = await buildApplicationDetailMessage(application, language);

  await ctx.answerCbQuery();
  await ctx.reply(message, {
    parse_mode: 'Markdown',
    ...applicationDetailKeyboard(application.id, documents, language),
  });
}

async function handleAdminStatusAction(
  ctx: AppContext,
  prefix: string,
  newStatus: 'accepted' | 'documents_required' | 'rejected',
): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (!isAdmin(ctx.from?.id) || !(await hasPermission(ctx.from?.id ?? 0, 'applications:update'))) {
    await ctx.answerCbQuery();
    return;
  }

  const applicationId = parseAdminApplicationCallback(ctx.callbackQuery.data, prefix);
  if (!applicationId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  try {
    const application = await findApplicationWithStudentById(applicationId);
    if (!application) {
      await ctx.answerCbQuery(texts.adminApplicationNotFound, { show_alert: true });
      return;
    }

    const result = await adminChangeApplicationStatus(
      applicationId,
      newStatus,
      ctx.from?.id,
    );
    if (!result.success) {
      await ctx.answerCbQuery(texts.adminApplicationNotFound, { show_alert: true });
      return;
    }

    const updated = await findApplicationWithStudentById(applicationId);
    const statusLabel = getApplicationStatusLabel(language, newStatus);

    await ctx.answerCbQuery(texts.adminStatusUpdated(statusLabel));

    if (updated && ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
      const isDetailView = ctx.callbackQuery.message.text.includes(
        texts.adminDocumentChecklistTitle,
      );

      if (isDetailView) {
        const documents = await findDocumentsByApplicationId(applicationId);
        const message = await buildApplicationDetailMessage(updated, language);
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          ...applicationDetailKeyboard(updated.id, documents, language),
        });
      } else {
        await ctx.editMessageText(await formatApplicationSummary(updated, language), {
          parse_mode: 'Markdown',
          ...applicationActionKeyboard(updated.id, language),
        });
      }
    }
  } catch (error) {
    logger.error({ error, applicationId, newStatus }, 'Admin status update failed');
    await ctx.answerCbQuery(texts.errorGeneric, { show_alert: true });
    throw error;
  }
}

export async function handleAdminAccept(ctx: AppContext): Promise<void> {
  await handleAdminStatusAction(ctx, ADMIN_ACCEPT_PREFIX, 'accepted');
}

export async function handleAdminRequestDocuments(ctx: AppContext): Promise<void> {
  await handleAdminStatusAction(ctx, ADMIN_DOC_REQ_PREFIX, 'documents_required');
}

export async function handleAdminReject(ctx: AppContext): Promise<void> {
  await handleAdminStatusAction(ctx, ADMIN_REJECT_PREFIX, 'rejected');
}

export async function handleAdminDocOpen(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (!isAdmin(ctx.from?.id) || !(await hasPermission(ctx.from?.id ?? 0, 'documents:verify'))) {
    await ctx.answerCbQuery();
    return;
  }

  const documentId = parseAdminDocumentCallback(ctx.callbackQuery.data, ADMIN_DOC_OPEN_PREFIX);
  if (!documentId) return;

  const language = getLanguage(ctx);
  const texts = t(language);
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const document = await getDocumentForAdminOpen(documentId);
  if (!document) {
    await ctx.answerCbQuery(texts.adminDocumentNotFound, { show_alert: true });
    return;
  }

  try {
    await ctx.answerCbQuery(texts.adminDocumentOpened);
    const result = await openDocumentForAdmin(chatId, documentId);
    if (!result.success) {
      await ctx.reply(texts.errorGeneric);
    }
  } catch (error) {
    logger.error({ error, documentId }, 'Failed to open document for admin');
    await ctx.answerCbQuery(texts.errorGeneric, { show_alert: true });
  }
}

export async function handleAdminDocVerify(ctx: AppContext): Promise<void> {
  await handleAdminDocReview(ctx, ADMIN_DOC_VERIFY_PREFIX, 'verified');
}

export async function handleAdminDocReject(ctx: AppContext): Promise<void> {
  await handleAdminDocReview(ctx, ADMIN_DOC_REJECT_PREFIX, 'rejected');
}

async function handleAdminDocReview(
  ctx: AppContext,
  prefix: string,
  action: 'verified' | 'rejected',
): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (!isAdmin(ctx.from?.id) || !(await hasPermission(ctx.from?.id ?? 0, 'documents:verify'))) {
    await ctx.answerCbQuery();
    return;
  }

  const documentId = parseAdminDocumentCallback(ctx.callbackQuery.data, prefix);
  if (!documentId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  const success =
    action === 'verified'
      ? await adminVerifyDocument(documentId, ctx.from?.id)
      : await adminRejectDocument(documentId, ctx.from?.id);

  if (!success) {
    await ctx.answerCbQuery(texts.adminDocumentNotFound, { show_alert: true });
    return;
  }

  await ctx.answerCbQuery(
    action === 'verified' ? texts.adminDocumentVerified : texts.adminDocumentRejected,
  );
}

export async function handleAdminSearchPhone(ctx: AppContext): Promise<void> {
  await handleAdminSearchType(ctx, 'phone');
}

export async function handleAdminSearchTelegramId(ctx: AppContext): Promise<void> {
  await handleAdminSearchType(ctx, 'telegram_id');
}

export async function handleAdminSearchName(ctx: AppContext): Promise<void> {
  await handleAdminSearchType(ctx, 'name');
}

export async function handleAdminSearchApplicationId(ctx: AppContext): Promise<void> {
  await handleAdminSearchType(ctx, 'application_id');
}

export async function handleAdminSearchUniversity(ctx: AppContext): Promise<void> {
  await handleAdminSearchType(ctx, 'university');
}

export async function handleAdminSearchStatus(ctx: AppContext): Promise<void> {
  await handleAdminSearchType(ctx, 'status');
}

export function isAdminMode(ctx: AppContext): boolean {
  return ctx.session.adminMode === true;
}

export function isAdminSearchActive(ctx: AppContext): boolean {
  return ctx.session.adminSearchMode !== null;
}
