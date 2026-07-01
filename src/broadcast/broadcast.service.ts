import { getStorageBackend } from '../database/storage';
import { query, queryOne } from '../database/index';
import { getNotificationBot } from '../services/application-status.service';
import { getUserStore } from '../database/storage';
import { getJobQueue } from '../queue/queue.factory';
import { logAdminAudit } from '../audit/audit-admin.service';
import { BroadcastCampaign, BroadcastFilters, CreateBroadcastInput } from './types';
import { sendTelegramMessage } from '../telegram/telegram-client';

interface CampaignRow {
  id: number;
  title: string;
  message: string;
  filters: BroadcastFilters;
  status: string;
  scheduled_at: Date | null;
  sent_count: number;
  total_targets: number;
  created_by: string;
  cancelled_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

const memoryCampaigns: BroadcastCampaign[] = [];
const memoryDeliveries = new Map<string, 'sending' | 'sent' | 'failed'>();
let memoryNextId = 1;

function mapRow(row: CampaignRow): BroadcastCampaign {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    filters: row.filters,
    status: row.status as BroadcastCampaign['status'],
    scheduled_at: row.scheduled_at,
    sent_count: row.sent_count,
    total_targets: row.total_targets,
    created_by: Number(row.created_by),
    cancelled_at: row.cancelled_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
  };
}

export async function createBroadcast(input: CreateBroadcastInput): Promise<BroadcastCampaign> {
  const status = input.scheduledAt ? 'scheduled' : 'draft';
  let campaign: BroadcastCampaign;

  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<CampaignRow>(
      `INSERT INTO broadcast_campaigns (title, message, filters, status, scheduled_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.title,
        input.message,
        JSON.stringify(input.filters),
        status,
        input.scheduledAt ?? null,
        input.createdBy,
      ],
    );
    if (!row) throw new Error('Failed to create broadcast');
    campaign = mapRow(row);
  } else {
    campaign = {
      id: memoryNextId++,
      title: input.title,
      message: input.message,
      filters: input.filters,
      status,
      scheduled_at: input.scheduledAt ?? null,
      sent_count: 0,
      total_targets: 0,
      created_by: input.createdBy,
      cancelled_at: null,
      completed_at: null,
      created_at: new Date(),
    };
    memoryCampaigns.push(campaign);
  }

  await logAdminAudit({
    adminId: input.createdBy,
    action: 'broadcast_created',
    entityType: 'broadcast',
    entityId: campaign.id,
    metadata: { newValue: campaign, filters: input.filters },
  });

  return { ...campaign };
}

export async function findBroadcastById(id: number): Promise<BroadcastCampaign | null> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<CampaignRow>(`SELECT * FROM broadcast_campaigns WHERE id = $1`, [id]);
    return row ? mapRow(row) : null;
  }
  const c = memoryCampaigns.find((x) => x.id === id);
  return c ? { ...c } : null;
}

export async function listRecentBroadcasts(limit = 10): Promise<BroadcastCampaign[]> {
  if (getStorageBackend() === 'postgres') {
    const rows = await query<CampaignRow>(
      `SELECT * FROM broadcast_campaigns ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(mapRow);
  }
  return memoryCampaigns.slice(-limit).reverse().map((c) => ({ ...c }));
}

async function resolveTargetTelegramIds(filters: BroadcastFilters): Promise<number[]> {
  if (getStorageBackend() === 'postgres') {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.allUsers) {
      const rows = await query<{ telegram_id: string }>(`SELECT telegram_id FROM users`);
      return rows.map((r) => Number(r.telegram_id));
    }

    if (filters.language) {
      params.push(filters.language);
      conditions.push(`u.language = $${params.length}`);
    }
    if (filters.registeredAfter) {
      params.push(filters.registeredAfter);
      conditions.push(`u.created_at >= $${params.length}`);
    }
    if (filters.country) {
      params.push(filters.country);
      conditions.push(
        `EXISTS (SELECT 1 FROM applications a WHERE a.telegram_id = u.telegram_id AND a.country = $${params.length})`,
      );
    }
    if (filters.universityId) {
      params.push(filters.universityId);
      conditions.push(
        `EXISTS (SELECT 1 FROM applications a WHERE a.telegram_id = u.telegram_id AND a.university_id = $${params.length})`,
      );
    }
    if (filters.applicationStatus) {
      params.push(filters.applicationStatus);
      conditions.push(
        `EXISTS (SELECT 1 FROM applications a WHERE a.telegram_id = u.telegram_id AND a.status = $${params.length})`,
      );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<{ telegram_id: string }>(
      `SELECT u.telegram_id FROM users u ${where}`,
      params,
    );
    return rows.map((r) => Number(r.telegram_id));
  }

  const users = await getUserStore().findRecent(Number.MAX_SAFE_INTEGER);
  return users
    .filter((u) => !filters.language || u.language === filters.language)
    .map((u) => u.telegram_id);
}

export async function countBroadcastTargets(filters: BroadcastFilters): Promise<number> {
  const ids = await resolveTargetTelegramIds(filters);
  return ids.length;
}

export async function scheduleBroadcastSend(campaignId: number): Promise<void> {
  await getJobQueue().enqueue({
    jobType: 'broadcast',
    payload: { campaignId },
    idempotencyKey: `broadcast:${campaignId}`,
  });
}

export async function processBroadcastCampaign(campaignId: number): Promise<void> {
  const campaign = await findBroadcastById(campaignId);
  if (!campaign || campaign.status === 'cancelled' || campaign.status === 'completed') return;

  const bot = getNotificationBot();
  if (!bot) {
    throw new Error('broadcast_bot_unavailable');
  }

  const targets = await resolveTargetTelegramIds(campaign.filters);
  let sent = campaign.sent_count;
  let failed = 0;

  await markBroadcastSending(campaignId, targets.length);

  for (const telegramId of targets) {
    const claimed = await claimBroadcastDelivery(campaignId, telegramId);
    if (!claimed) {
      continue;
    }

    const ok = await sendTelegramMessage({
      bot,
      chatId: telegramId,
      text: campaign.message,
      extra: { parse_mode: 'Markdown' },
    });

    if (ok) {
      await markBroadcastDelivered(campaignId, telegramId);
      sent += 1;
      await updateBroadcastProgress(campaignId, sent, targets.length);
    } else {
      failed += 1;
      await markBroadcastFailed(campaignId, telegramId, 'telegram_send_failed');
    }
  }

  if (failed > 0) {
    throw new Error(`broadcast_delivery_failed:${failed}`);
  }

  if (getStorageBackend() === 'postgres') {
    await queryOne(
      `UPDATE broadcast_campaigns
       SET status = 'completed', sent_count = $2, total_targets = $3, completed_at = NOW()
       WHERE id = $1`,
      [campaignId, sent, targets.length],
    );
  } else {
    const c = memoryCampaigns.find((x) => x.id === campaignId);
    if (c) {
      c.status = 'completed';
      c.sent_count = sent;
      c.total_targets = targets.length;
      c.completed_at = new Date();
    }
  }

  await logAdminAudit({
    adminId: campaign.created_by,
    action: 'broadcast_sent',
    entityType: 'broadcast',
    entityId: campaignId,
    metadata: { sent, total: targets.length, applicationId: undefined },
  });
}

async function markBroadcastSending(campaignId: number, total: number): Promise<void> {
  if (getStorageBackend() === 'postgres') {
    await queryOne(
      `UPDATE broadcast_campaigns
       SET status = 'sending', total_targets = $2
       WHERE id = $1 AND status IN ('draft', 'scheduled', 'sending')`,
      [campaignId, total],
    );
    return;
  }

  const c = memoryCampaigns.find((x) => x.id === campaignId);
  if (c) {
    c.status = 'sending';
    c.total_targets = total;
  }
}

async function claimBroadcastDelivery(
  campaignId: number,
  telegramId: number,
): Promise<boolean> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<{ status: string }>(
      `INSERT INTO broadcast_deliveries (campaign_id, telegram_id, status, delivered_at, last_error)
       VALUES ($1, $2, 'sending', NOW(), NULL)
       ON CONFLICT (campaign_id, telegram_id)
       DO UPDATE SET status = 'sending', last_error = NULL
       WHERE broadcast_deliveries.status NOT IN ('sent', 'sending')
       RETURNING status`,
      [campaignId, telegramId],
    );
    return row?.status === 'sending';
  }

  const key = `${campaignId}:${telegramId}`;
  const existing = memoryDeliveries.get(key);
  if (existing === 'sent' || existing === 'sending') {
    return false;
  }
  memoryDeliveries.set(key, 'sending');
  return true;
}

async function markBroadcastDelivered(campaignId: number, telegramId: number): Promise<void> {
  if (getStorageBackend() === 'postgres') {
    await queryOne(
      `UPDATE broadcast_deliveries
       SET status = 'sent', delivered_at = NOW(), last_error = NULL
       WHERE campaign_id = $1 AND telegram_id = $2 AND status = 'sending'`,
      [campaignId, telegramId],
    );
    return;
  }

  memoryDeliveries.set(`${campaignId}:${telegramId}`, 'sent');
}

async function markBroadcastFailed(
  campaignId: number,
  telegramId: number,
  error: string,
): Promise<void> {
  if (getStorageBackend() === 'postgres') {
    await queryOne(
      `INSERT INTO broadcast_deliveries (campaign_id, telegram_id, status, delivered_at, last_error)
       VALUES ($1, $2, 'failed', NOW(), $3)
       ON CONFLICT (campaign_id, telegram_id)
       DO UPDATE SET status = 'failed', delivered_at = NOW(), last_error = $3`,
      [campaignId, telegramId, error],
    );
    return;
  }

  memoryDeliveries.set(`${campaignId}:${telegramId}`, 'failed');
}

async function updateBroadcastProgress(
  campaignId: number,
  sent: number,
  total: number,
): Promise<void> {
  if (getStorageBackend() === 'postgres') {
    await queryOne(
      `UPDATE broadcast_campaigns
       SET sent_count = $2, total_targets = $3
       WHERE id = $1`,
      [campaignId, sent, total],
    );
    return;
  }

  const c = memoryCampaigns.find((x) => x.id === campaignId);
  if (c) {
    c.sent_count = sent;
    c.total_targets = total;
  }
}

export async function cancelBroadcast(
  campaignId: number,
  adminId?: number,
): Promise<boolean> {
  let ok = false;

  if (getStorageBackend() === 'postgres') {
    const row = await queryOne(
      `UPDATE broadcast_campaigns SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1 AND status IN ('draft', 'scheduled', 'sending') RETURNING id`,
      [campaignId],
    );
    ok = row !== null;
  } else {
    const c = memoryCampaigns.find((x) => x.id === campaignId);
    if (c && ['draft', 'scheduled', 'sending'].includes(c.status)) {
      c.status = 'cancelled';
      c.cancelled_at = new Date();
      ok = true;
    }
  }

  if (ok && adminId) {
    await logAdminAudit({
      adminId,
      action: 'broadcast_cancelled',
      entityType: 'broadcast',
      entityId: campaignId,
    });
  }

  return ok;
}

export function clearMemoryBroadcastsForTests(): void {
  memoryCampaigns.length = 0;
  memoryDeliveries.clear();
  memoryNextId = 1;
}
