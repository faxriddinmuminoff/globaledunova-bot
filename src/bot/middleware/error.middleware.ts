import { MiddlewareFn } from 'telegraf';
import { AppContext, getLanguage } from './context.middleware';
import { logger } from '../../logger';
import { t } from '../../i18n';

export function errorMiddleware(): MiddlewareFn<AppContext> {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      logger.error(
        {
          error,
          updateType: ctx.updateType,
          userId: ctx.from?.id,
        },
        'Unhandled bot error',
      );

      const language = getLanguage(ctx);
      const texts = t(language);

      try {
        await ctx.reply(texts.errorGeneric);
      } catch (replyError) {
        logger.error({ replyError }, 'Failed to send error message to user');
      }
    }
  };
}
