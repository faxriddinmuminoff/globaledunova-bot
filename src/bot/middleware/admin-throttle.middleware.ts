import { MiddlewareFn } from 'telegraf';
import { AppContext } from './context.middleware';
import { isAdminUser } from '../../rbac/rbac.service';
import { logger } from '../../logger';

interface AdminBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<number, AdminBucket>();
const WINDOW_MS = 60_000;
const MAX_ADMIN_ACTIONS = 60;
let operations = 0;

function pruneExpiredBuckets(now: number): void {
  for (const [userId, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) {
      buckets.delete(userId);
    }
  }
}

export function adminThrottleMiddleware(): MiddlewareFn<AppContext> {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin) return next();

    const now = Date.now();
    operations += 1;
    if (operations % 100 === 0) {
      pruneExpiredBuckets(now);
    }

    let bucket = buckets.get(userId);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      buckets.set(userId, bucket);
    }

    bucket.count += 1;

    if (bucket.count > MAX_ADMIN_ACTIONS) {
      logger.warn({ userId }, 'Admin action throttle exceeded');
      if (ctx.callbackQuery) await ctx.answerCbQuery('Too many actions. Please wait.');
      return;
    }

    return next();
  };
}

export function clearAdminThrottleForTests(): void {
  buckets.clear();
}
