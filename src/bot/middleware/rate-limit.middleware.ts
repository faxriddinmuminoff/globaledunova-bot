import { MiddlewareFn } from 'telegraf';
import { AppContext, getLanguage } from './context.middleware';
import { config } from '../../config';
import { t } from '../../i18n';

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<number, RateBucket>();
let operations = 0;

function pruneExpiredBuckets(now: number): void {
  for (const [userId, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) {
      buckets.delete(userId);
    }
  }
}

export function rateLimitMiddleware(): MiddlewareFn<AppContext> {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const now = Date.now();
    const windowMs = config.RATE_LIMIT_WINDOW_MS;
    const maxRequests = config.RATE_LIMIT_MAX_REQUESTS;

    operations += 1;
    if (operations % 100 === 0) {
      pruneExpiredBuckets(now);
    }

    let bucket = buckets.get(userId);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(userId, bucket);
    }

    bucket.count += 1;

    if (bucket.count > maxRequests) {
      const language = getLanguage(ctx);
      await ctx.reply(t(language).rateLimitExceeded).catch(() => undefined);
      return;
    }

    return next();
  };
}
