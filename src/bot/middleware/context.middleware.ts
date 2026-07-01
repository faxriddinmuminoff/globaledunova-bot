import { Context, MiddlewareFn } from 'telegraf';
import { findUserByTelegramId } from '../../database/repositories/user.repository';
import { Language, OnboardingStep, SessionData } from '../../types';
import { logger } from '../../logger';
import { config } from '../../config';

export type AppContext = Context;

const defaultSession = (): SessionData => ({
  onboardingStep: OnboardingStep.Language,
  language: 'en',
  user: null,
  documentFlow: null,
  adminMode: false,
  adminSearchMode: null,
  adminSearchQuery: null,
  adminSearchPage: 1,
  adminWizard: null,
});

export function sessionMiddleware(): MiddlewareFn<AppContext> {
  const sessions = new Map<number, { data: SessionData; lastSeen: number }>();
  let operations = 0;

  const pruneExpired = (now: number) => {
    for (const [userId, session] of sessions.entries()) {
      if (now - session.lastSeen > config.SESSION_TTL_MS) {
        sessions.delete(userId);
      }
    }
  };

  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const now = Date.now();
    operations += 1;
    if (operations % 100 === 0) {
      pruneExpired(now);
    }

    let session = sessions.get(userId);
    if (!session || now - session.lastSeen > config.SESSION_TTL_MS) {
      session = { data: defaultSession(), lastSeen: now };
      sessions.set(userId, session);
    }

    session.lastSeen = now;
    ctx.session = session.data;
    return next();
  };
}

export function userMiddleware(): MiddlewareFn<AppContext> {
  return async (ctx, next) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return next();

    if (!ctx.session) {
      ctx.session = defaultSession();
    }

    try {
      const user = await findUserByTelegramId(telegramId);
      ctx.session.user = user;
      ctx.session.language = user?.language ?? 'en';

      if (user?.phone_number) {
        ctx.session.onboardingStep = OnboardingStep.Complete;
      } else if (user?.language) {
        ctx.session.onboardingStep = OnboardingStep.Phone;
      }
    } catch (error) {
      logger.error({ error, telegramId }, 'Failed to load user');
      ctx.session.user = null;
      ctx.session.language = 'en';
    }

    return next();
  };
}

export function getLanguage(ctx: AppContext): Language {
  return ctx.session.language;
}

export function getUser(ctx: AppContext) {
  return ctx.session.user;
}
