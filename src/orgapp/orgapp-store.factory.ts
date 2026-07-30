import path from 'node:path';
import { config, isProduction } from '../config';
import { logger } from '../logger';
import { JsonOrgApplicationStore } from './json-orgapp.store';
import { MemoryOrgApplicationStore } from './memory-orgapp.store';
import { OrgApplicationStore } from './orgapp-store.types';

let store: OrgApplicationStore | null = null;

export const ORG_APPLICATIONS_FILE = 'organization-applications.json';

/**
 * Initialise the store. Called once at startup so a broken data file fails the
 * boot loudly instead of surfacing as a mysterious empty list hours later.
 */
export async function initializeOrgApplicationStore(): Promise<OrgApplicationStore> {
  if (store) return store;

  if (config.NODE_ENV === 'test') {
    store = new MemoryOrgApplicationStore();
    return store;
  }

  const filePath = path.join(config.DATA_DIR, ORG_APPLICATIONS_FILE);
  const jsonStore = new JsonOrgApplicationStore(filePath);
  await jsonStore.load();
  store = jsonStore;

  logger.info(
    { filePath, count: await jsonStore.countAll(), isProduction },
    'Organization application store ready',
  );
  return store;
}

export function getOrgApplicationStore(): OrgApplicationStore {
  if (!store) {
    // A memory fallback here would silently drop real applications, so refuse.
    throw new Error(
      'Organization application store is not initialized — call initializeOrgApplicationStore() first',
    );
  }
  return store;
}

export function setOrgApplicationStoreForTests(next: OrgApplicationStore | null): void {
  store = next;
}
