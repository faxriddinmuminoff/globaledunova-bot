import { Markup } from 'telegraf';
import { Language } from '../../types';
import { Application } from '../../universities/types';
import { getUniversityById } from '../../universities/university.service';
import { t } from '../../i18n';

export const APP_VIEW_PREFIX = 'sapp:v:';
export const APP_REFRESH_PREFIX = 'sapp:r:';
export const APP_UPLOAD_PREFIX = 'sapp:u:';
export const APP_CONTACT_PREFIX = 'sapp:c:';

export async function applicationListKeyboard(applications: Application[], language: Language) {
  const rows = await Promise.all(
    applications.map(async (app) => {
      const uni = await getUniversityById(app.university_id, language);
      const label = uni ? `${uni.name} (#${app.id})` : `#${app.id}`;
      return [Markup.button.callback(`📋 ${label}`, `${APP_VIEW_PREFIX}${app.id}`)];
    }),
  );

  return Markup.inlineKeyboard(rows);
}

export function applicationDetailKeyboard(applicationId: number, language: Language) {
  const texts = t(language);

  return Markup.inlineKeyboard([
    [Markup.button.callback(texts.appRefreshButton, `${APP_REFRESH_PREFIX}${applicationId}`)],
    [
      Markup.button.callback(
        texts.appUploadMissingButton,
        `${APP_UPLOAD_PREFIX}${applicationId}`,
      ),
    ],
    [
      Markup.button.callback(
        texts.appContactManagerButton,
        `${APP_CONTACT_PREFIX}${applicationId}`,
      ),
    ],
  ]);
}

export function parseApplicationCallback(data: string, prefix: string): number | null {
  if (!data.startsWith(prefix)) return null;
  const id = Number(data.slice(prefix.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}
