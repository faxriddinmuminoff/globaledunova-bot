import { getDocumentStore } from '../storage';
import { Document, DocumentStatus, CreateDocumentData } from '../../documents/types';

export async function createDocument(data: CreateDocumentData): Promise<Document> {
  return getDocumentStore().create(data);
}

export async function findDocumentsByTelegramId(
  telegramId: number,
): Promise<Document[]> {
  return getDocumentStore().findByTelegramId(telegramId);
}

export async function findDocumentsByApplicationId(
  applicationId: number,
): Promise<Document[]> {
  return getDocumentStore().findByApplicationIdOnly(applicationId);
}

export async function findDocumentById(id: number): Promise<Document | null> {
  return getDocumentStore().findByIdOnly(id);
}

export async function updateDocumentStatus(
  id: number,
  status: DocumentStatus,
): Promise<Document | null> {
  return getDocumentStore().updateStatusById(id, status);
}

export async function documentExists(
  applicationId: number,
  telegramId: number,
  documentType: CreateDocumentData['document_type'],
): Promise<boolean> {
  return getDocumentStore().exists(applicationId, telegramId, documentType);
}

export async function countDocumentsByStatus(status: DocumentStatus): Promise<number> {
  return getDocumentStore().countByStatus(status);
}
