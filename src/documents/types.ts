export type DocumentType =
  | 'passport'
  | 'diploma'
  | 'transcript'
  | 'ielts'
  | 'motivation_letter'
  | 'photo';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export type StorageProviderType = 'telegram' | 'local' | 's3';

export interface Document {
  id: number;
  telegram_id: number;
  application_id: number;
  document_type: DocumentType;
  telegram_file_id: string;
  original_file_name: string;
  uploaded_at: Date;
  status: DocumentStatus;
  storage_provider: StorageProviderType;
  storage_key: string | null;
  storage_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  checksum: string | null;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  'passport',
  'diploma',
  'transcript',
  'ielts',
  'motivation_letter',
  'photo',
];

export const DOC_APP_PREFIX = 'doc:app:';
export const DOC_TYPE_PREFIX = 'doc:type:';
export const DOC_CANCEL = 'doc:cancel';

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export interface CreateDocumentData {
  telegram_id: number;
  application_id: number;
  document_type: DocumentType;
  telegram_file_id: string;
  original_file_name: string;
  status?: DocumentStatus;
  storage_provider?: StorageProviderType;
  storage_key?: string | null;
  storage_url?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  checksum?: string | null;
}
