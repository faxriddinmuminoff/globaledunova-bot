import crypto from 'crypto';
import { StorageProvider } from './storage-provider.interface';
import { StoreFileInput, StoreFileResult, StoredFileMetadata } from './types';

export class TelegramStorageProvider implements StorageProvider {
  readonly name = 'telegram';

  async store(input: StoreFileInput): Promise<StoreFileResult> {
    if (!input.telegramFileId) {
      throw new Error('telegramFileId is required for TelegramStorageProvider');
    }

    const checksum = crypto
      .createHash('sha256')
      .update(`${input.telegramFileId}:${input.originalFileName}`)
      .digest('hex');

    return {
      provider: 'telegram',
      key: input.telegramFileId,
      checksum,
    };
  }

  async getUrl(metadata: StoredFileMetadata): Promise<string | null> {
    return metadata.url ?? metadata.key ?? null;
  }

  async delete(_metadata: StoredFileMetadata): Promise<boolean> {
    return true;
  }
}
