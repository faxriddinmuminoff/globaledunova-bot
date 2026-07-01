import { AppContext, getLanguage } from '../middleware/context.middleware';
import { t } from '../../i18n';
import { Language } from '../../types';
import { config } from '../../config';
import {
  findApplicationById,
  findApplicationsByTelegramId,
} from '../../database/repositories/application.repository';
import { getApplicationDetailView } from '../../services/application-detail.service';
import { getApplicationStatusLabel } from '../../services/application-status.service';
import { getUniversityById } from '../../universities/university.service';
import { formatAdminDate, getDegreeLabel } from '../../admin/formatters';
import { formatChecklistLine } from '../../admin/document-checklist';
import {
  applicationListKeyboard,
  applicationDetailKeyboard,
  parseApplicationCallback,
  APP_VIEW_PREFIX,
  APP_REFRESH_PREFIX,
  APP_UPLOAD_PREFIX,
  APP_CONTACT_PREFIX,
} from '../keyboards/application.keyboard';
import { startDocumentsFlow } from './documents.handler';
import { logger } from '../../logger';

function formatTimeline(language: Language, view: Awaited<ReturnType<typeof getApplicationDetailView>>): string {
  if (!view || view.timeline.length === 0) {
    return t(language).appNoTimeline;
  }

  return view.timeline
    .map((event) => {
      const date = formatAdminDate(event.created_at, language);
      const fromLabel = event.from_status
        ? getApplicationStatusLabel(language, event.from_status)
        : '—';
      const toLabel = event.to_status
        ? getApplicationStatusLabel(language, event.to_status)
        : '—';
      return t(language).appTimelineEntry(date, fromLabel, toLabel);
    })
    .join('\n');
}

async function buildDetailMessage(
  language: Language,
  view: NonNullable<Awaited<ReturnType<typeof getApplicationDetailView>>>,
): Promise<string> {
  const texts = t(language);
  const university = await getUniversityById(view.application.university_id, language);

  const checklist = view.checklist.map((item) => formatChecklistLine(language, item)).join('\n');

  const uploaded =
    view.documents.length === 0
      ? texts.adminNoUploadedDocuments
      : view.documents
          .map((doc) => {
            const label = texts.documentTypes[doc.document_type];
            return `• ${label} — ${doc.original_file_name}`;
          })
          .join('\n');

  const missing =
    view.missingTypes.length === 0
      ? texts.adminAllDocumentsUploaded
      : view.missingTypes.map((type) => `❌ ${texts.documentTypes[type as keyof typeof texts.documentTypes]}`).join('\n');

  return texts.appDetailPage(
    university?.name ?? view.application.university_id,
    texts.countries[view.application.country],
    getDegreeLabel(language, view.application.degree),
    getApplicationStatusLabel(language, view.application.status),
    formatTimeline(language, view),
    checklist,
    uploaded,
    missing,
    view.application.id,
  );
}

export async function showMyApplicationsWithDetails(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);
  const applications = await findApplicationsByTelegramId(telegramId);

  if (applications.length === 0) {
    await ctx.reply(texts.noApplicationsYet, { parse_mode: 'Markdown' });
    return;
  }

  await ctx.reply(texts.applicationsListTitle, {
    parse_mode: 'Markdown',
    ...(await applicationListKeyboard(applications, language)),
  });
}

export async function handleApplicationView(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const applicationId = parseApplicationCallback(ctx.callbackQuery.data, APP_VIEW_PREFIX);
  if (!applicationId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  const view = await getApplicationDetailView(applicationId, telegramId);
  if (!view) {
    await ctx.answerCbQuery(texts.applicationNotFound, { show_alert: true });
    return;
  }

  const message = await buildDetailMessage(language, view);

  await ctx.answerCbQuery();
  await ctx.reply(message, {
    parse_mode: 'Markdown',
    ...applicationDetailKeyboard(applicationId, language),
  });
}

export async function handleApplicationRefresh(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const applicationId = parseApplicationCallback(ctx.callbackQuery.data, APP_REFRESH_PREFIX);
  if (!applicationId) return;

  const language = getLanguage(ctx);
  const texts = t(language);
  const view = await getApplicationDetailView(applicationId, telegramId);

  if (!view) {
    await ctx.answerCbQuery(texts.applicationNotFound, { show_alert: true });
    return;
  }

  const message = await buildDetailMessage(language, view);

  await ctx.answerCbQuery(texts.appRefreshed);
  if (ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...applicationDetailKeyboard(applicationId, language),
    });
  } else {
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...applicationDetailKeyboard(applicationId, language),
    });
  }
}

export async function handleApplicationUploadMissing(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const applicationId = parseApplicationCallback(ctx.callbackQuery.data, APP_UPLOAD_PREFIX);
  if (!applicationId) return;

  const language = getLanguage(ctx);
  const texts = t(language);
  const application = await findApplicationById(applicationId, telegramId);
  if (!application) {
    await ctx.answerCbQuery(texts.applicationNotFound, { show_alert: true });
    return;
  }

  await ctx.answerCbQuery();
  ctx.session.documentFlow = null;
  await startDocumentsFlow(ctx);
}

export async function handleApplicationContactManager(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const applicationId = parseApplicationCallback(ctx.callbackQuery.data, APP_CONTACT_PREFIX);
  if (!applicationId) return;

  const language = getLanguage(ctx);
  const texts = t(language);
  const application = await findApplicationById(applicationId, telegramId);
  if (!application) {
    await ctx.answerCbQuery(texts.applicationNotFound, { show_alert: true });
    return;
  }

  await ctx.answerCbQuery();
  await ctx.reply(
    texts.contactManagerText(config.MANAGER_USERNAME) +
      `\n\n${texts.appContactReference(applicationId)}`,
    { parse_mode: 'Markdown' },
  );
}

export async function handleApplicationCallbacks(ctx: AppContext): Promise<void> {
  try {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
    const data = ctx.callbackQuery.data;

    if (data.startsWith(APP_VIEW_PREFIX)) return handleApplicationView(ctx);
    if (data.startsWith(APP_REFRESH_PREFIX)) return handleApplicationRefresh(ctx);
    if (data.startsWith(APP_UPLOAD_PREFIX)) return handleApplicationUploadMissing(ctx);
    if (data.startsWith(APP_CONTACT_PREFIX)) return handleApplicationContactManager(ctx);
  } catch (error) {
    logger.error({ error }, 'Application callback failed');
    throw error;
  }
}
