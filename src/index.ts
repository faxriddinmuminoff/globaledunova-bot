import { config } from './config';
import { logger } from './logger';
import { initializeStorage, shutdownStorage } from './database/storage';
import { createBot } from './bot/bot';
import { setNotificationBot } from './services/application-status.service';

async function shutdown(signal: string, bot: ReturnType<typeof createBot>): Promise<void> {
  logger.info({ signal }, 'Shutting down gracefully');

  bot.stop(signal);
  await shutdownStorage();

  process.exit(0);
}

async function main(): Promise<void> {
  logger.info('Starting GlobalEduNova bot...');

  const storageBackend = await initializeStorage();
  logger.info({ storageBackend }, 'Storage initialized');

  const bot = createBot(config.BOT_TOKEN);
  setNotificationBot(bot);

  process.once('SIGINT', () => shutdown('SIGINT', bot));
  process.once('SIGTERM', () => shutdown('SIGTERM', bot));

  await bot.launch();
  logger.info('Bot is running');
}

main().catch((error) => {
  logger.fatal({ error }, 'Failed to start bot');
  process.exit(1);
});
