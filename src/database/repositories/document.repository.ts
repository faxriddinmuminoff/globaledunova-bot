import { getDocumentStore } from '../storage';
import { Document, DocumentType } from '../../documents/types';

export async function createDocument(data: {
  telegram_id: number;
  application_id: number;
  document_type: DocumentType;
  telegram_file_id: string;
  original_file_name: string;
}): Promise<Document> {
  return getDocumentStore().create(data);
}

export async function findDocumentsByTelegramId(
  telegramId: number,
): Promise<Document[]> {
  return getDocumentStore().findByTelegramId(telegramId);
}

export async function documentExists(
  applicationId: number,
  telegramId: number,
  documentType: DocumentType,
): Promise<boolean> {
  return getDocumentStore().exists(applicationId, telegramId, documentType);
}
