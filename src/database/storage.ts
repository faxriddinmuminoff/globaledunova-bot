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
import { MemoryApplicationEventStore } from './stores/memory-application-event.store';
import { PostgresApplicationEventStore } from './stores/postgres-application-event.store';
import { MemoryActivityLogStore } from './stores/memory-activity-log.store';
import { PostgresActivityLogStore } from './stores/postgres-activity-log.store';
import { MemoryRequirementStore } from './stores/memory-requirement.store';
import {
  PostgresRequirementStore,
  DEFAULT_REQUIREMENT_DOC_TYPES,
} from './stores/postgres-requirement.store';
import {
  MemoryUniversityStore,
  ensureMemoryUniversitySeed,
} from './stores/memory-university.store';
import { PostgresUniversityStore } from './stores/postgres-university.store';
import { StorageBackend, UserStore } from './stores/types';
import { ApplicationStore } from './stores/application-store.types';
import { DocumentStore } from './stores/document-store.types';
import { NotificationStore } from './stores/notification-store.types';
import { ApplicationEventStore } from './stores/application-event-store.types';
import { ActivityLogStore } from './stores/activity-log-store.types';
import { RequirementStore } from './stores/requirement-store.types';
import { UniversityStore } from '../universities/university-store.types';
import { getAllUniversityIds } from '../universities/seed-data';
import { seedAdminUsersFromEnv, refreshAdminCache } from '../rbac/rbac.service';

let backend: StorageBackend = 'memory';
let userStore: UserStore = new MemoryUserStore();
let applicationStore: ApplicationStore = new MemoryApplicationStore();
let documentStore: DocumentStore = new MemoryDocumentStore();
let notificationStore: NotificationStore = new MemoryNotificationStore();
let applicationEventStore: ApplicationEventStore = new MemoryApplicationEventStore();
let activityLogStore: ActivityLogStore = new MemoryActivityLogStore();
let requirementStore: RequirementStore = new MemoryRequirementStore();
let universityStore: UniversityStore = new MemoryUniversityStore();

export function getStorageBackend(): StorageBackend {
  return backend;
}

export { checkConnection } from './index';

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

export function getApplicationEventStore(): ApplicationEventStore {
  return applicationEventStore;
}

export function getActivityLogStore(): ActivityLogStore {
  return activityLogStore;
}

export function getRequirementStore(): RequirementStore {
  return requirementStore;
}

export function getUniversityStore(): UniversityStore {
  return universityStore;
}

async function seedMemoryData(): Promise<void> {
  await ensureMemoryUniversitySeed(universityStore as MemoryUniversityStore);
  const ids = await getAllUniversityIds();
  await requirementStore.seedDefaults(ids, DEFAULT_REQUIREMENT_DOC_TYPES);
}

async function seedEnterpriseData(): Promise<void> {
  await seedAdminUsersFromEnv();
  await refreshAdminCache();
}

export async function initializeStorage(): Promise<StorageBackend> {
  if (!config.DATABASE_URL) {
    if (isProduction) {
      logger.fatal('DATABASE_URL is required in production');
      process.exit(1);
    }

    logger.warn('DATABASE_URL is not set — using in-memory storage (development only)');
    useMemoryStorage();
    await seedMemoryData();
    await seedEnterpriseData();
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
      await seedMemoryData();
      await seedEnterpriseData();
      return backend;
    }

    usePostgresStorage();
    logger.info('Using PostgreSQL storage (all entities)');
    await seedEnterpriseData();
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
  await seedMemoryData();
  await seedEnterpriseData();
  return backend;
}

function usePostgresStorage(): void {
  backend = 'postgres';
  userStore = new PostgresUserStore();
  applicationStore = new PostgresApplicationStore();
  documentStore = new PostgresDocumentStore();
  notificationStore = new PostgresNotificationStore();
  applicationEventStore = new PostgresApplicationEventStore();
  activityLogStore = new PostgresActivityLogStore();
  requirementStore = new PostgresRequirementStore();
  universityStore = new PostgresUniversityStore();
}

function useMemoryStorage(): void {
  backend = 'memory';
  userStore = new MemoryUserStore();
  applicationStore = new MemoryApplicationStore();
  documentStore = new MemoryDocumentStore();
  notificationStore = new MemoryNotificationStore();
  applicationEventStore = new MemoryApplicationEventStore();
  activityLogStore = new MemoryActivityLogStore();
  requirementStore = new MemoryRequirementStore();
  universityStore = new MemoryUniversityStore();
}

export async function shutdownStorage(): Promise<void> {
  if (isPoolActive()) {
    await closePool();
  }
}

/** Resets all stores to fresh in-memory instances (test-only). */
export async function resetStorageForTests(): Promise<void> {
  if (isPoolActive()) {
    await closePool();
  }
  useMemoryStorage();
  await seedMemoryData();
}
