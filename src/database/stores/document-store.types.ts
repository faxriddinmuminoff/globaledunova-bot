import {
  Document,
  DocumentStatus,
  DocumentType,
} from '../../documents/types';

export interface DocumentStore {
  create(data: {
    telegram_id: number;
    application_id: number;
    document_type: DocumentType;
    telegram_file_id: string;
    original_file_name: string;
    status?: DocumentStatus;
  }): Promise<Document>;

  findByTelegramId(telegramId: number): Promise<Document[]>;

  findByApplicationId(applicationId: number, telegramId: number): Promise<Document[]>;

  exists(
    applicationId: number,
    telegramId: number,
    documentType: DocumentType,
  ): Promise<boolean>;
}
