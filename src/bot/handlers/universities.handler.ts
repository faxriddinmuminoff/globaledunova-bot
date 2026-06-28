import { AppContext, getLanguage } from '../middleware/context.middleware';
import { t } from '../../i18n';
import { Language } from '../../types';
import {
  countrySelectionKeyboard,
  degreeSelectionKeyboard,
  universitiesListKeyboard,
  parseApplyCallback,
  parseBackToDegreesCallback,
  parseCountryCallback,
  parseDegreeCallback,
} from '../keyboards/universities.keyboard';
import {
  getUniversitiesForSelection,
  getUniversityById,
} from '../../universities/catalog';
import {
  applicationExists,
  createApplication,
  findApplicationsByTelegramId,
} from '../../database/repositories/application.repository';
import { CountryCode, DegreeType, UNI_BACK_COUNTRIES } from '../../universities/types';
import {
  getApplicationStatusLabel,
  notifyApplicationSubmitted,
} from '../../services/application-status.service';
import { logger } from '../../logger';

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
  });
}

export async function startUniversitiesFlow(ctx: AppContext): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);

  await ctx.reply(texts.selectCountry, {
    parse_mode: 'Markdown',
    ...countrySelectionKeyboard(language),
  });
}

async function showDegreeSelection(
  ctx: AppContext,
  country: CountryCode,
  edit = false,
): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);
  const countryName = texts.countries[country];
  const message = `${texts.selectDegree}\n\n🌍 ${countryName}`;
  const keyboard = degreeSelectionKeyboard(country, language);

  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard });
  } else {
    await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
  }
}

async function showUniversitiesList(
  ctx: AppContext,
  country: CountryCode,
  degree: DegreeType,
): Promise<void> {
  const language = getLanguage(ctx);
  const texts = t(language);
  const countryName = texts.countries[country];
  const degreeName = getDegreeLabel(language, degree);
  const universities = getUniversitiesForSelection(country, degree, language);

  const header = texts.universityListHeader(countryName, degreeName);
  const body = universities
    .map((uni, index) => texts.universityCard(index + 1, uni.name, uni.city))
    .join('\n\n');

  await ctx.editMessageText(`${header}\n\n${body}`, {
    parse_mode: 'Markdown',
    ...universitiesListKeyboard(country, degree, universities, language),
  });
}

export async function handleCountrySelection(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const country = parseCountryCallback(ctx.callbackQuery.data);
  if (!country) return;

  await ctx.answerCbQuery();
  await showDegreeSelection(ctx, country, true);
}

export async function handleDegreeSelection(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const parsed = parseDegreeCallback(ctx.callbackQuery.data);
  if (!parsed) return;

  await ctx.answerCbQuery();
  await showUniversitiesList(ctx, parsed.country, parsed.degree);
}

export async function handleUniversityApply(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const parsed = parseApplyCallback(ctx.callbackQuery.data);
  if (!parsed) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  try {
    const exists = await applicationExists(
      telegramId,
      parsed.universityId,
      parsed.degree,
    );

    if (exists) {
      await ctx.answerCbQuery(texts.applicationDuplicate, { show_alert: true });
      return;
    }

    const application = await createApplication({
      telegram_id: telegramId,
      university_id: parsed.universityId,
      country: parsed.country,
      degree: parsed.degree,
      status: 'submitted',
    });

    await notifyApplicationSubmitted(application, language);

    const university = getUniversityById(parsed.universityId, language);
    const countryName = texts.countries[parsed.country];
    const degreeName = getDegreeLabel(language, parsed.degree);

    await ctx.answerCbQuery();
    await ctx.reply(
      texts.applicationSuccess(
        university?.name ?? parsed.universityId,
        countryName,
        degreeName,
      ),
    );
  } catch (error) {
    logger.error({ error, telegramId, parsed }, 'Failed to submit application');
    await ctx.answerCbQuery(texts.errorGeneric, { show_alert: true });
    throw error;
  }
}

export async function handleBackToCountries(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  if (ctx.callbackQuery.data !== UNI_BACK_COUNTRIES) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  await ctx.answerCbQuery();
  await ctx.editMessageText(texts.selectCountry, {
    parse_mode: 'Markdown',
    ...countrySelectionKeyboard(language),
  });
}

export async function handleBackToDegrees(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const country = parseBackToDegreesCallback(ctx.callbackQuery.data);
  if (!country) return;

  await ctx.answerCbQuery();
  await showDegreeSelection(ctx, country, true);
}

export async function showMyApplications(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const language = getLanguage(ctx);
  const texts = t(language);

  const applications = await findApplicationsByTelegramId(telegramId);

  if (applications.length === 0) {
    await ctx.reply(texts.noApplicationsYet, { parse_mode: 'Markdown' });
    return;
  }

  const entries = applications
    .map((app, index) => {
      const university = getUniversityById(app.university_id, language);
      return texts.applicationEntry(
        index + 1,
        university?.name ?? app.university_id,
        texts.countries[app.country],
        getDegreeLabel(language, app.degree),
        formatDate(app.created_at, language),
        getApplicationStatusLabel(language, app.status),
      );
    })
    .join('\n\n');

  await ctx.reply(`${texts.applicationsListTitle}\n\n${entries}`, {
    parse_mode: 'Markdown',
  });
}
