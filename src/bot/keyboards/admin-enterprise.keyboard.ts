import { Markup } from 'telegraf';
import { Language } from '../../types';
import { t } from '../../i18n';
import {
  ADMIN_SET_MANAGER,
  ADMIN_SET_REMINDER,
  ADMIN_SET_STORAGE,
  ADMIN_SET_NOTIF,
  ADMIN_SET_MAINT,
  ADMIN_UNI_ADD,
  ADMIN_UNI_LIST,
  ADMIN_BC_CREATE,
  ADMIN_BC_CONFIRM,
  ADMIN_BC_AUDIENCE_PREFIX,
  ADMIN_BACKUP_RUN,
  ADMIN_BACKUP_LIST,
  ADMIN_BACKUP_VERIFY,
  ADMIN_BACKUP_RESTORE_SIM,
  ADMIN_INCIDENT_RETRY_PREFIX,
  ADMIN_INCIDENT_IGNORE_PREFIX,
  ADMIN_INCIDENT_DETAILS_PREFIX,
  ADMIN_DASH_TODAY,
  ADMIN_DASH_WEEK,
  ADMIN_DASH_MONTH,
  ADMIN_SEARCH_PREV,
  ADMIN_SEARCH_NEXT,
} from '../../admin/types';
import { COUNTRY_CODES } from '../../universities/types';
import { DOCUMENT_TYPES } from '../../documents/types';

export function settingsMenuKeyboard(language: Language) {
  const texts = t(language);
  return Markup.inlineKeyboard([
    [Markup.button.callback(texts.adminSettingsManager, ADMIN_SET_MANAGER)],
    [Markup.button.callback(texts.adminSettingsReminder, ADMIN_SET_REMINDER)],
    [Markup.button.callback(texts.adminSettingsStorage, ADMIN_SET_STORAGE)],
    [Markup.button.callback(texts.adminSettingsNotifications, ADMIN_SET_NOTIF)],
    [Markup.button.callback(texts.adminSettingsMaintenance, ADMIN_SET_MAINT)],
  ]);
}

export function universitiesMenuKeyboard(language: Language) {
  const texts = t(language);
  return Markup.inlineKeyboard([
    [Markup.button.callback(texts.adminUniversityAdd, ADMIN_UNI_ADD)],
    [Markup.button.callback(texts.adminUniversityList, ADMIN_UNI_LIST)],
  ]);
}

export function broadcastMenuKeyboard(language: Language) {
  const texts = t(language);
  return Markup.inlineKeyboard([
    [Markup.button.callback(texts.adminBroadcastCreate, ADMIN_BC_CREATE)],
  ]);
}

export function broadcastAudienceKeyboard(language: Language) {
  const texts = t(language);
  return Markup.inlineKeyboard([
    [Markup.button.callback(texts.adminBroadcastAudienceAll, `${ADMIN_BC_AUDIENCE_PREFIX}all`)],
    [Markup.button.callback(texts.adminBroadcastAudienceAccepted, `${ADMIN_BC_AUDIENCE_PREFIX}accepted`)],
    [Markup.button.callback(texts.adminBroadcastAudienceReviewing, `${ADMIN_BC_AUDIENCE_PREFIX}reviewing`)],
    [
      Markup.button.callback(
        texts.adminBroadcastAudienceDocsRequired,
        `${ADMIN_BC_AUDIENCE_PREFIX}documents_required`,
      ),
    ],
  ]);
}

export function broadcastConfirmKeyboard(_language: Language) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Confirm & Queue', ADMIN_BC_CONFIRM)],
  ]);
}

export function backupMenuKeyboard(language: Language) {
  const texts = t(language);
  return Markup.inlineKeyboard([
    [Markup.button.callback(texts.adminBackupsRun, ADMIN_BACKUP_RUN)],
    [Markup.button.callback('✅ Verify Backup', ADMIN_BACKUP_VERIFY)],
    [Markup.button.callback('🧪 Restore Simulation', ADMIN_BACKUP_RESTORE_SIM)],
    [Markup.button.callback('📋 Recent', ADMIN_BACKUP_LIST)],
  ]);
}

export function incidentsKeyboard(incidents: { id: string; retryable: boolean }[]) {
  const rows = incidents.slice(0, 10).flatMap((incident) => {
    const encoded = encodeURIComponent(incident.id);
    const buttons = [
      Markup.button.callback('Details', `${ADMIN_INCIDENT_DETAILS_PREFIX}${encoded}`),
      Markup.button.callback('Ignore', `${ADMIN_INCIDENT_IGNORE_PREFIX}${encoded}`),
    ];
    if (incident.retryable) {
      buttons.unshift(Markup.button.callback('Retry', `${ADMIN_INCIDENT_RETRY_PREFIX}${encoded}`));
    }
    return [buttons];
  });
  return rows.length > 0 ? Markup.inlineKeyboard(rows) : undefined;
}

export function dashboardPeriodKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('Today', ADMIN_DASH_TODAY),
      Markup.button.callback('Week', ADMIN_DASH_WEEK),
      Markup.button.callback('Month', ADMIN_DASH_MONTH),
    ],
  ]);
}

export function countryWizardKeyboard() {
  const rows = COUNTRY_CODES.map((code) => [
    Markup.button.callback(code.toUpperCase(), `adm:uni:c:${code}`),
  ]);
  return Markup.inlineKeyboard(rows);
}

export function degreeWizardKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Bachelor', 'adm:uni:d:bachelor')],
    [Markup.button.callback('Master', 'adm:uni:d:master')],
    [Markup.button.callback('PhD', 'adm:uni:d:phd')],
    [Markup.button.callback('All degrees', 'adm:uni:d:all')],
  ]);
}

export function requirementsWizardKeyboard(selected: Record<string, boolean> = {}) {
  const rows = DOCUMENT_TYPES.map((type) => {
    const on = selected[type] !== false;
    return [
      Markup.button.callback(`${on ? '✅' : '❌'} ${type}`, `adm:uni:req:${type}`),
    ];
  });
  rows.push([Markup.button.callback('✅ Save university', 'adm:uni:save')]);
  return Markup.inlineKeyboard(rows);
}

export function searchPaginationKeyboard(
  language: Language,
  page: number,
  totalPages: number,
) {
  const texts = t(language);
  const row: ReturnType<typeof Markup.button.callback>[] = [];
  if (page > 1) row.push(Markup.button.callback(texts.adminSearchPrev, ADMIN_SEARCH_PREV));
  if (page < totalPages) row.push(Markup.button.callback(texts.adminSearchNext, ADMIN_SEARCH_NEXT));
  return row.length > 0 ? Markup.inlineKeyboard([row]) : undefined;
}

export function universityDeactivateKeyboard(universities: { id: string; name: string }[]) {
  const rows = universities.slice(0, 10).map((u) => [
    Markup.button.callback(`🗑 ${u.name}`, `adm:uni:off:${u.id}`),
  ]);
  return Markup.inlineKeyboard(rows);
}
