import { config, isProduction } from '../config';
import { logger } from '../logger';
import { checkConnection, closePool, isPoolActive } from './index';
import { runMigrations } from './migrate';
import { MemoryUserStore } from './stores/memory-user.store';
import { PostgresUserStore } from './stores/postgres-user.store';
import { MemoryApplicationStore } from './stores/memory-application.store';
import { PostgresApplicationStore } from './stores/postgres-application.store';
import { MemoryDocumentStore } from './stores/memory-document.store';
import { PostgresDocumentStore } from './stores/postgres-document.store';
import { MemoryNotificationStore } from './stores/memory-notification.store';
import { PostgresNotificationStore } from './stores/postgres-notification.store';
import { StorageBackend, UserStore } from './stores/types';
import { ApplicationStore } from './stores/application-store.types';
import { DocumentStore } from './stores/document-store.types';
import { NotificationStore } from './stores/notification-store.types';

let backend: StorageBackend = 'memory';
let userStore: UserStore = new MemoryUserStore();
let applicationStore: ApplicationStore = new MemoryApplicationStore();
let documentStore: DocumentStore = new MemoryDocumentStore();
let notificationStore: NotificationStore = new MemoryNotificationStore();

export function getStorageBackend(): StorageBackend {
  return backend;
}

export function getUserStore(): UserStore {
  return userStore;
}

export function getApplicationStore(): ApplicationStore {
  return applicationStore;
}

export function getDocumentStore(): DocumentStore {
  return documentStore;
}

export function getNotificationStore(): NotificationStore {
  return notificationStore;
}

export async function initializeStorage(): Promise<StorageBackend> {
  if (!config.DATABASE_URL) {
    if (isProduction) {
      logger.fatal('DATABASE_URL is required in production');
      process.exit(1);
    }

    logger.warn('DATABASE_URL is not set — using in-memory storage (development only)');
    useMemoryStorage();
    return backend;
  }

  const connected = await checkConnection();

  if (connected) {
    try {
      await runMigrations();
      logger.info('Database migrations completed');
    } catch (error) {
      if (isProduction) {
        logger.fatal({ error }, 'Database migration failed in production');
        process.exit(1);
      }

      logger.warn(
        { error },
        'Database migration failed — falling back to in-memory storage (development only)',
      );
      await closePool();
      useMemoryStorage();
      return backend;
    }

    usePostgresStorage();
    logger.info('Using PostgreSQL storage (all entities)');
    return backend;
  }

  if (isProduction) {
    logger.fatal('Cannot connect to PostgreSQL in production');
    process.exit(1);
  }

  logger.warn(
    { databaseUrl: config.DATABASE_URL },
    'PostgreSQL unavailable — using in-memory storage (development only). Data will not persist across restarts.',
  );
  useMemoryStorage();
  return backend;
}

function usePostgresStorage(): void {
  backend = 'postgres';
  userStore = new PostgresUserStore();
  applicationStore = new PostgresApplicationStore();
  documentStore = new PostgresDocumentStore();
  notificationStore = new PostgresNotificationStore();
}

function useMemoryStorage(): void {
  backend = 'memory';
  userStore = new MemoryUserStore();
  applicationStore = new MemoryApplicationStore();
  documentStore = new MemoryDocumentStore();
  notificationStore = new MemoryNotificationStore();
}

export async function shutdownStorage(): Promise<void> {
  if (isPoolActive()) {
    await closePool();
  }
}
