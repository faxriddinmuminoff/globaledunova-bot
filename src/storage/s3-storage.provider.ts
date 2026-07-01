import crypto from 'crypto';
import { StorageProvider } from './storage-provider.interface';
import { StoreFileInput, StoreFileResult, StoredFileMetadata } from './types';

export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicBaseUrl?: string;
}

/**
 * S3-compatible storage (AWS S3, MinIO). Uses fetch-based PUT for minimal deps.
 * Configure S3_* env vars to activate.
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = 's3';

  constructor(private readonly config: S3StorageConfig) {}

  async store(input: StoreFileInput): Promise<StoreFileResult> {
    if (!input.buffer) {
      throw new Error('buffer is required for S3StorageProvider');
    }

    const checksum = crypto.createHash('sha256').update(input.buffer).digest('hex');
    const key = `documents/${checksum.slice(0, 32)}/${input.originalFileName}`;

    const url = this.buildObjectUrl(key);
    const response = await fetch(url, {
      method: 'PUT',
      body: input.buffer,
      headers: {
        'Content-Type': input.mimeType,
        'Content-Length': String(input.fileSize),
      },
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status}`);
    }

    return {
      provider: 's3',
      key,
      url: this.config.publicBaseUrl ? `${this.config.publicBaseUrl}/${key}` : url,
      checksum,
    };
  }

  async getUrl(metadata: StoredFileMetadata): Promise<string | null> {
    if (metadata.url) return metadata.url;
    if (!metadata.key) return null;
    return this.config.publicBaseUrl
      ? `${this.config.publicBaseUrl}/${metadata.key}`
      : this.buildObjectUrl(metadata.key);
  }

  async delete(metadata: StoredFileMetadata): Promise<boolean> {
    if (!metadata.key) return false;
    const response = await fetch(this.buildObjectUrl(metadata.key), { method: 'DELETE' });
    return response.ok;
  }

  private buildObjectUrl(key: string): string {
    const { bucket, region, endpoint } = this.config;
    if (endpoint) {
      return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
