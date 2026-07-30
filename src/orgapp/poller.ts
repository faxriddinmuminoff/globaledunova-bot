import { config } from '../config';
import { logger } from '../logger';
import { statusMessage } from './prompts';
import { listOpenApplications, refreshApplication } from './orgapp.service';
import { OrgApplicationRecord } from './types';
import { Language } from '../types';

export interface PollResult {
  checked: number;
  changed: number;
  notified: number;
  skippedTooOld: number;
  failed: number;
}

export type Notifier = (telegramId: number, message: string) => Promise<void>;

/** Resolves the applicant's language. Injected so the poller needs no DB in tests. */
export type LanguageResolver = (telegramId: number) => Promise<Language>;

/**
 * One polling pass over every open application.
 *
 * The bot asks; the platform never calls the bot. That is a deliberate choice: the
 * platform is a JSON-file app with no outbound worker, and for most of its life it
 * sits behind NAT. Polling keeps all the moving parts on this side.
 *
 * A failure on one application must not abort the pass — a single unreachable row
 * would otherwise starve every other applicant of their status update.
 */
export async function pollOpenApplications(
  notify: Notifier,
  resolveLanguage: LanguageResolver,
  now: number = Date.now(),
): Promise<PollResult> {
  const result: PollResult = {
    checked: 0,
    changed: 0,
    notified: 0,
    skippedTooOld: 0,
    failed: 0,
  };

  let open: OrgApplicationRecord[];
  try {
    open = await listOpenApplications();
  } catch (error) {
    logger.error({ error }, 'Could not list open applications');
    return result;
  }

  for (const record of open) {
    const submittedAt = Date.parse(record.submittedAt);
    // An abandoned row must not be polled forever. It stays in the store and stays
    // visible to the applicant — it simply stops costing a request every 5 minutes.
    if (Number.isFinite(submittedAt) && now - submittedAt > config.PLATFORM_POLL_MAX_AGE_MS) {
      result.skippedTooOld += 1;
      continue;
    }

    result.checked += 1;

    try {
      const transition = await refreshApplication(record.applicationId);
      if (!transition) continue;

      if (transition.record.status !== transition.previousStatus) {
        result.changed += 1;
      }

      if (!transition.shouldNotify) continue;

      const language = await resolveLanguage(transition.record.contactTelegramId);
      await notify(
        transition.record.contactTelegramId,
        statusMessage(language, transition.record),
      );
      result.notified += 1;
    } catch (error) {
      result.failed += 1;
      logger.error(
        { error, applicationId: record.applicationId },
        'Polling one application failed',
      );
    }
  }

  if (result.checked > 0 || result.failed > 0) {
    logger.info(result, 'Organization application poll finished');
  }

  return result;
}

/**
 * Start the recurring poll. Overlapping ticks are skipped rather than queued, so a
 * slow platform cannot pile up concurrent passes.
 */
export function startOrgApplicationPoller(
  notify: Notifier,
  resolveLanguage: LanguageResolver,
  intervalMs: number = config.PLATFORM_POLL_INTERVAL_MS,
): NodeJS.Timeout {
  let running = false;

  const tick = async () => {
    if (running) {
      logger.warn('Previous application poll still running; skipping this tick');
      return;
    }
    running = true;
    try {
      await pollOpenApplications(notify, resolveLanguage);
    } catch (error) {
      logger.error({ error }, 'Application poll tick failed');
    } finally {
      running = false;
    }
  };

  void tick();
  return setInterval(() => void tick(), intervalMs);
}
