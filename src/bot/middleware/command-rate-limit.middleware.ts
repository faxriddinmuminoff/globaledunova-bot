import { MiddlewareFn } from 'telegraf';
import { AppContext } from './context.middleware';
import { logger } from '../../logger';

interface CommandBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, CommandBucket>();
const WINDOW_MS = 60_000;
const MAX_COMMANDS = 10;
let operations = 0;

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function commandRateLimitMiddleware(): MiddlewareFn<AppContext> {
  return async (ctx, next) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!text?.startsWith('/')) return next();

    const userId = ctx.from?.id;
    if (!userId) return next();

    const now = Date.now();
    const key = `cmd:${userId}`;
    operations += 1;
    if (operations % 100 === 0) {
      pruneExpiredBuckets(now);
    }

    let bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > MAX_COMMANDS) {
      logger.warn({ userId, command: text.split(' ')[0] }, 'Command rate limit exceeded');
      return;
    }

    return next();
  };
}

export function clearCommandRateLimitsForTests(): void {
  buckets.clear();
}
