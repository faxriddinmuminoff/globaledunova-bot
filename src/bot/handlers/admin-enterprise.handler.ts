import { AppContext, getLanguage } from '../middleware/context.middleware';
import { isAdmin } from '../helpers/admin.helper';
import { t } from '../../i18n';
import {
  settingsMenuKeyboard,
  universitiesMenuKeyboard,
  broadcastMenuKeyboard,
  backupMenuKeyboard,
  broadcastAudienceKeyboard,
  broadcastConfirmKeyboard,
  countryWizardKeyboard,
  degreeWizardKeyboard,
  requirementsWizardKeyboard,
  universityDeactivateKeyboard,
  incidentsKeyboard,
  dashboardPeriodKeyboard,
} from '../keyboards/admin-enterprise.keyboard';
import { getSettingsOverview, updateSettingWithAudit, toggleBooleanSetting } from '../../services/admin-settings.service';
import {
  listManageableUniversities,
  saveUniversityWizard,
  deactivateUniversity,
  UniversityWizardDraft,
} from '../../services/admin-university.service';
import {
  createBroadcast,
  scheduleBroadcastSend,
  cancelBroadcast,
  countBroadcastTargets,
} from '../../broadcast/broadcast.service';
import {
  getBackupStatus,
  listRecentBackups,
  verifyLatestBackup,
  runRestoreSimulation,
  getLastRestoreSimulationAt,
} from '../../backup/backup.service';
import { getJobQueue } from '../../queue/queue.factory';
import { ignoreQueueJob, retryQueueJob } from '../../queue/queue-monitor.service';
import { getUniversityById } from '../../universities/university.service';
import { CountryCode, DegreeType } from '../../universities/types';
import { Language } from '../../types';
import { BroadcastFilters } from '../../broadcast/types';
import { SettingKey } from '../../settings/types';
import { logAdminAudit } from '../../audit/audit-admin.service';
import { hasPermission } from '../../rbac/rbac.service';
import { listIncidents, formatIncidents } from '../../incidents/incident.service';
import { getAnalyticsDashboard, formatAnalyticsDashboard, AnalyticsPeriod } from '../../analytics/dashboard.service';

export function isAdminWizardActive(ctx: AppContext): boolean {
  return Boolean(ctx.session.adminWizard);
}

async function requirePermission(
  ctx: AppContext,
  permission: Parameters<typeof hasPermission>[1],
): Promise<boolean> {
  const telegramId = ctx.from?.id;
  if (!telegramId || !(await hasPermission(telegramId, permission))) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('No permission', { show_alert: true });
    } else {
      await ctx.reply('No permission');
    }
    return false;
  }
  return true;
}

export async function handleAdminSettingsMenu(ctx: AppContext): Promise<void> {
  if (!(await requirePermission(ctx, 'settings:update'))) return;
  const language = getLanguage(ctx);
  const texts = t(language);
  await ctx.reply(texts.adminSettingsTitle, {
    parse_mode: 'Markdown',
    ...settingsMenuKeyboard(language),
  });
}

export async function handleAdminUniversitiesMenu(ctx: AppContext): Promise<void> {
  if (!(await requirePermission(ctx, 'universities:manage'))) return;
  const language = getLanguage(ctx);
  const texts = t(language);
  await ctx.reply(texts.adminUniversitiesTitle, {
    parse_mode: 'Markdown',
    ...universitiesMenuKeyboard(language),
  });
}

export async function handleAdminBroadcastsMenu(ctx: AppContext): Promise<void> {
  if (!(await requirePermission(ctx, 'broadcast:send'))) return;
  const language = getLanguage(ctx);
  const texts = t(language);
  await ctx.reply(texts.adminBroadcastsTitle, {
    parse_mode: 'Markdown',
    ...broadcastMenuKeyboard(language),
  });
}

export async function handleAdminBackupsMenu(ctx: AppContext): Promise<void> {
  if (!(await requirePermission(ctx, 'backup:view'))) return;
  const language = getLanguage(ctx);
  const texts = t(language);
  const status = await getBackupStatus();
  const last = status.lastBackup ? status.lastBackup.toISOString() : '—';
  const size = status.databaseSizeBytes ? `${Math.round(status.databaseSizeBytes / 1024 / 1024)} MB` : '—';

  await ctx.reply(texts.adminBackupsStatus(last, size, 30), {
    parse_mode: 'Markdown',
    ...backupMenuKeyboard(language),
  });
  await ctx.reply(texts.adminBackupsRestoreHint, { parse_mode: 'Markdown' });
  const lastRestore = getLastRestoreSimulationAt()?.toISOString() ?? 'never';
  await ctx.reply(`Last restore simulation: ${lastRestore}`);
}

async function requireQueueManageOrSettings(ctx: AppContext): Promise<boolean> {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('No permission', { show_alert: true });
    } else {
      await ctx.reply('No permission');
    }
    return false;
  }

  const allowed =
    (await hasPermission(telegramId, 'queue:manage')) ||
    (await hasPermission(telegramId, 'settings:update'));
  if (!allowed) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('No permission', { show_alert: true });
    } else {
      await ctx.reply('No permission');
    }
    return false;
  }
  return true;
}

export async function handleAdminIncidentsMenu(ctx: AppContext): Promise<void> {
  if (!(await requireQueueManageOrSettings(ctx))) return;
  const incidents = await listIncidents(10);
  await ctx.reply(await formatIncidents(10), {
    parse_mode: 'Markdown',
    ...incidentsKeyboard(incidents),
  });
}

export async function handleAdminAnalyticsDashboard(ctx: AppContext, period: AnalyticsPeriod = 'today'): Promise<void> {
  if (!(await requirePermission(ctx, 'statistics:view'))) return;
  const dashboard = await getAnalyticsDashboard(period);
  await ctx.reply(formatAnalyticsDashboard(dashboard), {
    parse_mode: 'Markdown',
    ...dashboardPeriodKeyboard(),
  });
}

export async function handleAdminEnterpriseCallback(ctx: AppContext): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
  const telegramId = ctx.from?.id;
  if (!telegramId || !isAdmin(telegramId)) return;

  const data = ctx.callbackQuery.data;
  const language = getLanguage(ctx);
  const texts = t(language);

  if (data.startsWith('adm:set:') && !(await requirePermission(ctx, 'settings:update'))) return;
  if (data.startsWith('adm:uni:') && !(await requirePermission(ctx, 'universities:manage'))) return;
  if (data.startsWith('adm:bc:') && !(await requirePermission(ctx, 'broadcast:send'))) return;
  if (data.startsWith('adm:bk:') && !(await requirePermission(ctx, 'backup:view'))) return;
  if (data.startsWith('adm:dash:') && !(await requirePermission(ctx, 'statistics:view'))) return;

  if (data === 'adm:set:mgr') {
    ctx.session.adminWizard = { type: 'settings', step: 'manager_username', data: {} };
    await ctx.answerCbQuery();
    await ctx.reply('Enter manager username (without @):');
    return;
  }

  if (data === 'adm:set:rem') {
    ctx.session.adminWizard = { type: 'settings', step: 'reminder_intervals', data: {} };
    await ctx.answerCbQuery();
    await ctx.reply('Enter reminder days comma-separated (e.g. 3,7,14):');
    return;
  }

  if (data === 'adm:set:sto') {
    ctx.session.adminWizard = { type: 'settings', step: 'default_storage_provider', data: {} };
    await ctx.answerCbQuery();
    await ctx.reply('Enter storage provider: telegram | local | s3');
    return;
  }

  if (data === 'adm:set:not' || data === 'adm:set:mnt') {
    const key = data === 'adm:set:not' ? 'notifications_enabled' : 'maintenance_mode';
    const next = await toggleBooleanSetting(key, telegramId);
    await ctx.answerCbQuery(texts.adminSettingsUpdated(key));
    await ctx.reply(`${key}: ${next}`);
    return;
  }

  if (data === 'adm:uni:add') {
    ctx.session.adminWizard = {
      type: 'university',
      step: 'country',
      data: { requirements: {}, supportedDegrees: ['bachelor', 'master', 'phd'] },
    };
    await ctx.answerCbQuery();
    await ctx.reply(texts.adminUniversityWizardCountry, countryWizardKeyboard());
    return;
  }

  if (data === 'adm:uni:list') {
    const list = await listManageableUniversities();
    const items = await Promise.all(
      list.map(async (u) => {
        const info = await getUniversityById(u.id, language);
        return { id: u.id, name: info?.name ?? u.id };
      }),
    );
    await ctx.answerCbQuery();
    await ctx.reply(
      items.map((i) => `• ${i.name} (${i.id})`).join('\n') || '—',
      universityDeactivateKeyboard(items),
    );
    return;
  }

  if (data.startsWith('adm:uni:c:')) {
    const country = data.slice('adm:uni:c:'.length) as CountryCode;
    if (!ctx.session.adminWizard) return;
    ctx.session.adminWizard.data.countryCode = country;
    ctx.session.adminWizard.step = 'degree';
    await ctx.answerCbQuery();
    await ctx.reply(texts.adminUniversityWizardDegree, degreeWizardKeyboard());
    return;
  }

  if (data.startsWith('adm:uni:d:')) {
    const degree = data.slice('adm:uni:d:'.length);
    if (!ctx.session.adminWizard) return;
    ctx.session.adminWizard.data.supportedDegrees =
      degree === 'all'
        ? (['bachelor', 'master', 'phd'] as DegreeType[])
        : ([degree] as DegreeType[]);
    ctx.session.adminWizard.step = 'name_en';
    await ctx.answerCbQuery();
    await ctx.reply(texts.adminUniversityWizardNameEn);
    return;
  }

  if (data.startsWith('adm:uni:req:')) {
    const docType = data.slice('adm:uni:req:'.length);
    if (!ctx.session.adminWizard) return;
    const reqs = (ctx.session.adminWizard.data.requirements ?? {}) as Record<string, boolean>;
    reqs[docType] = reqs[docType] === false;
    ctx.session.adminWizard.data.requirements = reqs;
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(requirementsWizardKeyboard(reqs).reply_markup);
    return;
  }

  if (data === 'adm:uni:save') {
    const draft = ctx.session.adminWizard?.data as UniversityWizardDraft;
    const record = await saveUniversityWizard(draft, telegramId, false);
    ctx.session.adminWizard = null;
    await ctx.answerCbQuery();
    await ctx.reply(texts.adminUniversitySaved(record.id));
    return;
  }

  if (data.startsWith('adm:uni:off:')) {
    const id = data.slice('adm:uni:off:'.length);
    await deactivateUniversity(id, telegramId);
    await ctx.answerCbQuery();
    await ctx.reply(texts.adminUniversityDeactivated(id));
    return;
  }

  if (data === 'adm:bc:new') {
    ctx.session.adminWizard = { type: 'broadcast', step: 'audience', data: {} };
    await ctx.answerCbQuery();
    await ctx.reply('Select audience:', broadcastAudienceKeyboard(language));
    return;
  }

  if (data.startsWith('adm:bc:aud:')) {
    const audience = data.slice('adm:bc:aud:'.length);
    const filters: BroadcastFilters =
      audience === 'all'
        ? { allUsers: true }
        : { applicationStatus: audience };
    if (!ctx.session.adminWizard) return;
    ctx.session.adminWizard.data.filters = filters;
    ctx.session.adminWizard.step = 'message';
    await ctx.answerCbQuery();
    await ctx.reply(texts.adminBroadcastEnterMessage);
    return;
  }

  if (data === 'adm:bc:ok') {
    const wizard = ctx.session.adminWizard;
    if (!wizard || wizard.type !== 'broadcast') return;
    const message = String(wizard.data.message ?? '');
    const filters = wizard.data.filters as BroadcastFilters;
    const campaign = await createBroadcast({
      title: `Broadcast ${new Date().toISOString()}`,
      message,
      filters,
      createdBy: telegramId,
    });
    await scheduleBroadcastSend(campaign.id);
    ctx.session.adminWizard = null;
    await ctx.answerCbQuery();
    await ctx.reply(texts.adminBroadcastQueued(campaign.id));
    return;
  }

  if (data === 'adm:bk:run') {
    if (!(await requirePermission(ctx, 'backup:view'))) return;
    await getJobQueue().enqueue({ jobType: 'backup', payload: { triggeredBy: telegramId } });
    await ctx.answerCbQuery('Backup queued');
    return;
  }

  if (data === 'adm:bk:verify') {
    const result = await verifyLatestBackup();
    await ctx.answerCbQuery(result.ok ? 'Backup verified' : 'Backup verification failed', {
      show_alert: !result.ok,
    });
    await ctx.reply(`${result.ok ? '✅' : '🚨'} ${result.message}`);
    return;
  }

  if (data === 'adm:bk:restore') {
    const result = await runRestoreSimulation();
    await ctx.answerCbQuery(result.ok ? 'Restore simulation passed' : 'Restore simulation failed', {
      show_alert: !result.ok,
    });
    await ctx.reply(`${result.ok ? '✅' : '🚨'} ${result.message}`);
    return;
  }

  if (data === 'adm:bk:list') {
    const rows = await listRecentBackups(5);
    await ctx.answerCbQuery();
    await ctx.reply(
      rows.map((r) => `• ${r.filename} (${r.status})`).join('\n') || 'No backups yet',
    );
    return;
  }

  if (data === 'adm:inc:list') {
    if (!(await requireQueueManageOrSettings(ctx))) return;
    await ctx.answerCbQuery();
    await handleAdminIncidentsMenu(ctx);
    return;
  }

  if (data.startsWith('adm:inc:retry:')) {
    if (!(await requireQueueManageOrSettings(ctx))) return;
    const id = decodeURIComponent(data.slice('adm:inc:retry:'.length));
    const jobId = Number(id.replace('job:', ''));
    const ok = Number.isInteger(jobId) ? await retryQueueJob(jobId) : false;
    await ctx.answerCbQuery(ok ? 'Retry queued' : 'Retry failed', { show_alert: !ok });
    await handleAdminIncidentsMenu(ctx);
    return;
  }

  if (data.startsWith('adm:inc:ignore:')) {
    if (!(await requireQueueManageOrSettings(ctx))) return;
    const id = decodeURIComponent(data.slice('adm:inc:ignore:'.length));
    const jobId = Number(id.replace('job:', ''));
    const ok = Number.isInteger(jobId) ? await ignoreQueueJob(jobId) : true;
    await ctx.answerCbQuery(ok ? 'Incident ignored' : 'Ignore failed', { show_alert: !ok });
    await handleAdminIncidentsMenu(ctx);
    return;
  }

  if (data.startsWith('adm:inc:details:')) {
    await ctx.answerCbQuery();
    const id = decodeURIComponent(data.slice('adm:inc:details:'.length));
    const incidents = await listIncidents(20);
    const incident = incidents.find((i) => i.id === id);
    await ctx.reply(
      incident
        ? `*${incident.title}*\n\nType: \`${incident.type}\`\nID: \`${incident.id}\`\n${incident.details}`
        : 'Incident not found',
      { parse_mode: 'Markdown' },
    );
    return;
  }

  if (data.startsWith('adm:dash:')) {
    await ctx.answerCbQuery();
    await handleAdminAnalyticsDashboard(ctx, data.slice('adm:dash:'.length) as AnalyticsPeriod);
    return;
  }
}

export async function handleAdminEnterpriseInput(ctx: AppContext): Promise<boolean> {
  if (!ctx.message || !('text' in ctx.message)) return false;
  if (!ctx.session.adminWizard) return false;

  const telegramId = ctx.from?.id;
  if (!telegramId || !isAdmin(telegramId)) return false;

  const language = getLanguage(ctx);
  const texts = t(language);
  const text = ctx.message.text.trim();
  const wizard = ctx.session.adminWizard;

  if (wizard.type === 'settings') {
    if (!(await requirePermission(ctx, 'settings:update'))) {
      ctx.session.adminWizard = null;
      return true;
    }
    const key = wizard.step as SettingKey;
    let value: unknown = text;
    if (key === 'reminder_intervals') {
      value = text.split(',').map((n) => Number(n.trim())).filter((n) => n > 0);
    }
    if (key === 'maintenance_mode' || key === 'notifications_enabled') {
      value = text === 'true' || text === '1';
    }
    await updateSettingWithAudit(key, value, telegramId);
    ctx.session.adminWizard = null;
    await ctx.reply(texts.adminSettingsUpdated(key));
    return true;
  }

  if (wizard.type === 'university') {
    if (!(await requirePermission(ctx, 'universities:manage'))) {
      ctx.session.adminWizard = null;
      return true;
    }
    if (wizard.step === 'name_en') {
      wizard.data.names = {
        en: { name: text, city: '—' },
        ru: { name: text, city: '—' },
        uz: { name: text, city: '—' },
      } satisfies Record<Language, { name: string; city: string }>;
      wizard.step = 'requirements';
      await ctx.reply(texts.adminUniversityWizardConfirm, requirementsWizardKeyboard());
      return true;
    }
  }

  if (wizard.type === 'broadcast' && wizard.step === 'message') {
    if (!(await requirePermission(ctx, 'broadcast:send'))) {
      ctx.session.adminWizard = null;
      return true;
    }
    wizard.data.message = text;
    const filters = wizard.data.filters as BroadcastFilters;
    const targets = await countBroadcastTargets(filters);
    await ctx.reply(texts.adminBroadcastPreview(text, targets), broadcastConfirmKeyboard(language));
    wizard.step = 'confirm';
    return true;
  }

  return false;
}

export async function handleAdminLoginAudit(ctx: AppContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  await logAdminAudit({ adminId: telegramId, action: 'admin_login', entityType: 'admin' });
}

export async function showSettingsOverview(_ctx: AppContext): Promise<string> {
  const overview = await getSettingsOverview();
  return Object.entries(overview)
    .map(([k, v]) => `• ${k}: ${JSON.stringify(v)}`)
    .join('\n');
}

export async function cancelBroadcastByAdmin(campaignId: number, adminId: number): Promise<boolean> {
  return cancelBroadcast(campaignId, adminId);
}
