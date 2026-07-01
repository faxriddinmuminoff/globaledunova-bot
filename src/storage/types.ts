export type StorageProviderType = 'telegram' | 'local' | 's3';

export interface StoredFileMetadata {
  provider: StorageProviderType;
  key: string;
  url?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  checksum?: string | null;
  telegramFileId?: string | null;
}

export interface StoreFileInput {
  buffer?: Buffer;
  telegramFileId?: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
}

export interface StoreFileResult {
  provider: StorageProviderType;
  key: string;
  url?: string | null;
  checksum?: string | null;
}
