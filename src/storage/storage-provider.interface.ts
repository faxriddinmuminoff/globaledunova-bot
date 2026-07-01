import { StoreFileInput, StoreFileResult, StoredFileMetadata } from './types';

export interface StorageProvider {
  readonly name: string;

  store(input: StoreFileInput): Promise<StoreFileResult>;

  getUrl(metadata: StoredFileMetadata): Promise<string | null>;

  delete(metadata: StoredFileMetadata): Promise<boolean>;
}
