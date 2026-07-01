import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { StorageProvider } from './storage-provider.interface';
import { StoreFileInput, StoreFileResult, StoredFileMetadata } from './types';

export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';

  constructor(private readonly baseDir: string) {}

  async store(input: StoreFileInput): Promise<StoreFileResult> {
    if (!input.buffer) {
      throw new Error('buffer is required for LocalStorageProvider');
    }

    const checksum = crypto.createHash('sha256').update(input.buffer).digest('hex');
    const ext = path.extname(input.originalFileName) || '.bin';
    const key = `${checksum.slice(0, 16)}${ext}`;
    const fullPath = path.join(this.baseDir, key);

    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(fullPath, input.buffer);

    return {
      provider: 'local',
      key,
      url: fullPath,
      checksum,
    };
  }

  async getUrl(metadata: StoredFileMetadata): Promise<string | null> {
    if (metadata.url) return metadata.url;
    if (!metadata.key) return null;
    return path.join(this.baseDir, metadata.key);
  }

  async delete(metadata: StoredFileMetadata): Promise<boolean> {
    const filePath = metadata.url ?? path.join(this.baseDir, metadata.key);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
