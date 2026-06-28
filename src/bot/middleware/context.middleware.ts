import { Context, MiddlewareFn } from 'telegraf';
import { findUserByTelegramId } from '../../database/repositories/user.repository';
import { Language, OnboardingStep, SessionData } from '../../types';
import { logger } from '../../logger';

export type AppContext = Context;

const defaultSession = (): SessionData => ({
  onboardingStep: OnboardingStep.Language,
  language: 'en',
  user: null,
  documentFlow: null,
});

export function sessionMiddleware(): MiddlewareFn<AppContext> {
  const sessions = new Map<number, SessionData>();

  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    if (!sessions.has(userId)) {
      sessions.set(userId, defaultSession());
    }

    ctx.session = sessions.get(userId)!;
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
