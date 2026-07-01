import crypto from 'crypto';
import { getDefaultStorageProvider } from './storage.factory';
import { StoreFileInput, StoredFileMetadata } from './types';
import { NoOpFileScanner } from './noop-file-scanner';

const scanner = new NoOpFileScanner();

export interface PersistDocumentFileInput {
  telegramFileId: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  buffer?: Buffer;
}

export interface PersistDocumentFileResult {
  storage_provider: StoredFileMetadata['provider'];
  storage_key: string;
  storage_url: string | null;
  file_size: number;
  mime_type: string;
  checksum: string;
  telegram_file_id: string;
}

export async function persistDocumentFile(
  input: PersistDocumentFileInput,
): Promise<PersistDocumentFileResult> {
  const scan = await scanner.scan({
    fileName: input.originalFileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
  });

  if (!scan.safe) {
    throw new Error(scan.reason ?? 'File failed security scan');
  }

  const provider = getDefaultStorageProvider();
  const storeInput: StoreFileInput = {
    telegramFileId: input.telegramFileId,
    originalFileName: input.originalFileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    buffer: input.buffer,
  };

  const stored = await provider.store(storeInput);
  const checksum =
    stored.checksum ??
    crypto
      .createHash('sha256')
      .update(`${input.telegramFileId}:${input.originalFileName}`)
      .digest('hex');

  return {
    storage_provider: stored.provider,
    storage_key: stored.key,
    storage_url: stored.url ?? null,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    checksum,
    telegram_file_id: input.telegramFileId,
  };
}
