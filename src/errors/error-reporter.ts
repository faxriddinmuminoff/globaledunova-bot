import { Telegraf } from 'telegraf';
import { adminTelegramIds } from '../config';
import { logger } from '../logger';

export interface CriticalErrorContext {
  telegramId?: number;
  handler: string;
  payload?: unknown;
  timestamp?: string;
}

export interface ErrorReporter {
  report(error: unknown, context: CriticalErrorContext): Promise<void>;
}

export class ConsoleErrorReporter implements ErrorReporter {
  async report(error: unknown, context: CriticalErrorContext): Promise<void> {
    logger.error({ error, context }, 'Critical exception reported');
  }
}

export class TelegramAdminReporter implements ErrorReporter {
  constructor(private readonly getBot: () => Telegraf | null) {}

  async report(error: unknown, context: CriticalErrorContext): Promise<void> {
    const bot = this.getBot();
    if (!bot || adminTelegramIds.length === 0) return;

    const err = error instanceof Error ? error : new Error(String(error));
    const text = [
      '🚨 *Critical exception*',
      `Handler: \`${context.handler}\``,
      `Telegram ID: \`${context.telegramId ?? '—'}\``,
      `Timestamp: \`${context.timestamp ?? new Date().toISOString()}\``,
      '',
      `Payload: \`${JSON.stringify(context.payload ?? {}).slice(0, 1000)}\``,
      '',
      `Stack:\n\`${(err.stack ?? err.message).slice(0, 2500)}\``,
    ].join('\n');

    await Promise.allSettled(
      adminTelegramIds.map((adminId) =>
        bot.telegram.sendMessage(adminId, text, { parse_mode: 'Markdown' }),
      ),
    );
  }
}

const reporters: ErrorReporter[] = [new ConsoleErrorReporter()];

export function registerErrorReporter(reporter: ErrorReporter): void {
  reporters.push(reporter);
}

export async function reportCriticalError(
  error: unknown,
  context: CriticalErrorContext,
): Promise<void> {
  const fullContext = { ...context, timestamp: context.timestamp ?? new Date().toISOString() };
  await Promise.allSettled(reporters.map((reporter) => reporter.report(error, fullContext)));
}
