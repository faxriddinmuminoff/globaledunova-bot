import { config } from './config';
import { logger } from './logger';
import { initializeStorage, shutdownStorage } from './database/storage';
import { createBot } from './bot/bot';
import { setNotificationBot } from './services/application-status.service';
import { startHealthServer } from './health/server';
import { startJobWorker, startReminderJobScheduler, scheduleRecurringJobs } from './queue/job-processor';
import { runStartupDiagnostics } from './observability/startup-diagnostics';
import { registerErrorReporter, TelegramAdminReporter } from './errors/error-reporter';
import { runReleaseReadinessReport } from './observability/release-readiness.service';
import { initializeOrgApplicationStore } from './orgapp/orgapp-store.factory';
import { startOrgApplicationPoller } from './orgapp/poller';
import { findUserByTelegramId } from './database/repositories/user.repository';
import { Language } from './types';

let shutdownStarted = false;

function closeHealthServer(
  healthServer: ReturnType<typeof startHealthServer>,
): Promise<void> {
  return new Promise((resolve) => {
    healthServer.close((error) => {
      if (error) {
        logger.error({ error }, 'Health server close failed');
      }
      resolve();
    });
  });
}

async function shutdown(
  signal: string,
  bot: ReturnType<typeof createBot>,
  healthServer: ReturnType<typeof startHealthServer>,
  jobWorkerTimer: NodeJS.Timeout,
  reminderTimer: NodeJS.Timeout,
  applicationPollTimer: NodeJS.Timeout,
): Promise<void> {
  if (shutdownStarted) return;
  shutdownStarted = true;

  logger.info({ signal }, 'Shutting down gracefully');

  clearInterval(jobWorkerTimer);
  clearInterval(reminderTimer);
  clearInterval(applicationPollTimer);

  try {
    bot.stop(signal);
  } catch (error) {
    logger.warn({ error }, 'Bot stop reported an error during shutdown');
  }

  await closeHealthServer(healthServer);
  await shutdownStorage();

  process.exit(0);
}

async function main(): Promise<void> {
  logger.info('Starting GlobalEduNova bot...');

  const storageBackend = await initializeStorage();
  logger.info({ storageBackend }, 'Storage initialized');
  // Loaded before anything can serve a request: a corrupt data file must fail the
  // boot loudly, not surface hours later as an empty application list.
  await initializeOrgApplicationStore();
  await runStartupDiagnostics();

  const healthServer = startHealthServer(config.HEALTH_PORT);
  const bot = createBot(config.BOT_TOKEN);
  setNotificationBot(bot);
  registerErrorReporter(new TelegramAdminReporter(() => bot));

  const jobWorkerTimer = startJobWorker();
  const reminderTimer = startReminderJobScheduler();
  const applicationPollTimer = startOrgApplicationPoller(
    async (telegramId, message) => {
      await bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    },
    async (telegramId): Promise<Language> => {
      try {
        const user = await findUserByTelegramId(telegramId);
        return user?.language ?? 'uz';
      } catch (error) {
        // A language lookup must never be the reason a status update is lost.
        logger.warn({ error, telegramId }, 'Could not resolve applicant language');
        return 'uz';
      }
    },
  );
  await scheduleRecurringJobs();
  await runReleaseReadinessReport();

  process.once('SIGINT', () => {
    void shutdown('SIGINT', bot, healthServer, jobWorkerTimer, reminderTimer, applicationPollTimer).catch((error) => {
      logger.fatal({ error }, 'Graceful shutdown failed');
      process.exit(1);
    });
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM', bot, healthServer, jobWorkerTimer, reminderTimer, applicationPollTimer).catch((error) => {
      logger.fatal({ error }, 'Graceful shutdown failed');
      process.exit(1);
    });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    void reportProcessError(reason, 'process:unhandled_rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    void reportProcessError(error, 'process:uncaught_exception').finally(() => {
      void shutdown(
        'uncaughtException',
        bot,
        healthServer,
        jobWorkerTimer,
        reminderTimer,
        applicationPollTimer,
      );
    });
  });

  await bot.launch();
  logger.info('Bot is running');
}

async function reportProcessError(error: unknown, handler: string): Promise<void> {
  const { reportCriticalError } = await import('./errors/error-reporter');
  await reportCriticalError(error, { handler });
}

main().catch((error) => {
  logger.fatal({ error }, 'Failed to start bot');
  process.exit(1);
});
