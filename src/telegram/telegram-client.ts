import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { config, isStaging } from '../config';
import { logger } from '../logger';
import {
  incrementMetric,
  trackNotificationFailed,
  trackNotificationSent,
} from '../observability/metrics';

export interface TelegramSender {
  telegram: {
    sendMessage(chatId: number, text: string, extra?: ExtraReplyMessage): Promise<unknown>;
  };
}

export interface SendTelegramMessageInput {
  bot: TelegramSender | null;
  chatId: number;
  text: string;
  extra?: ExtraReplyMessage;
  fake?: boolean;
  maxAttempts?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterMs(error: unknown): number | null {
  const maybe = error as { parameters?: { retry_after?: number }; response?: { parameters?: { retry_after?: number } } };
  const retryAfter = maybe.parameters?.retry_after ?? maybe.response?.parameters?.retry_after;
  return typeof retryAfter === 'number' ? retryAfter * 1000 : null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('telegram_send_timeout')), timeoutMs);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

export async function sendTelegramMessage(input: SendTelegramMessageInput): Promise<boolean> {
  if (input.fake || (isStaging && config.STAGING_FAKE_NOTIFICATIONS)) {
    logger.info({ chatId: input.chatId }, 'Staging fake Telegram message');
    incrementMetric('telegram_fake_messages');
    return true;
  }

  if (!input.bot) {
    logger.warn({ chatId: input.chatId }, 'Telegram bot is not configured');
    trackNotificationFailed();
    return false;
  }

  const maxAttempts = input.maxAttempts ?? 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await withTimeout(
        input.bot.telegram.sendMessage(input.chatId, input.text, input.extra),
        config.TELEGRAM_SEND_TIMEOUT_MS,
      );
      trackNotificationSent();
      incrementMetric('telegram_send_success');
      return true;
    } catch (error) {
      const retryAfterMs = getRetryAfterMs(error);
      const delayMs = retryAfterMs ?? Math.min(10_000, 500 * 2 ** (attempt - 1));
      logger.warn({ error, chatId: input.chatId, attempt, delayMs }, 'Telegram send failed');
      incrementMetric('telegram_send_retry');

      if (attempt === maxAttempts) {
        trackNotificationFailed();
        incrementMetric('telegram_send_failed');
        return false;
      }

      await sleep(delayMs);
    }
  }

  return false;
}
