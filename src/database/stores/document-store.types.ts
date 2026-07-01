import {
  Document,
  DocumentStatus,
  DocumentType,
  CreateDocumentData,
} from '../../documents/types';

export interface DocumentStore {
  create(data: CreateDocumentData): Promise<Document>;

  findByTelegramId(telegramId: number): Promise<Document[]>;

  findByApplicationId(applicationId: number, telegramId: number): Promise<Document[]>;

  exists(
    applicationId: number,
    telegramId: number,
    documentType: DocumentType,
  ): Promise<boolean>;

  findRecent(limit: number): Promise<Document[]>;

  findByApplicationIdOnly(applicationId: number): Promise<Document[]>;

  findByIdOnly(id: number): Promise<Document | null>;

  updateStatusById(id: number, status: DocumentStatus): Promise<Document | null>;

  countByStatus(status: DocumentStatus): Promise<number>;
}
