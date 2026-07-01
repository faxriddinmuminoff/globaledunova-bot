import { config } from '../config';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { StorageProvider } from './storage-provider.interface';
import { TelegramStorageProvider } from './telegram-storage.provider';
import { StorageProviderType } from './types';

const providers = new Map<StorageProviderType, StorageProvider>();

export function getStorageProvider(type: StorageProviderType = 'telegram'): StorageProvider {
  const existing = providers.get(type);
  if (existing) return existing;

  let provider: StorageProvider;

  switch (type) {
    case 'local':
      provider = new LocalStorageProvider(config.LOCAL_STORAGE_DIR);
      break;
    case 's3':
      if (!config.S3_BUCKET) {
        throw new Error('S3_BUCKET is required for s3 storage');
      }
      provider = new S3StorageProvider({
        bucket: config.S3_BUCKET,
        region: config.S3_REGION,
        endpoint: config.S3_ENDPOINT,
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY,
        publicBaseUrl: config.S3_PUBLIC_BASE_URL,
      });
      break;
    case 'telegram':
    default:
      provider = new TelegramStorageProvider();
      break;
  }

  providers.set(type, provider);
  return provider;
}

export function getDefaultStorageProvider(): StorageProvider {
  return getStorageProvider(config.DEFAULT_STORAGE_PROVIDER);
}
