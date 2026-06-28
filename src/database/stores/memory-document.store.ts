import { Document, DocumentType } from '../../documents/types';
import { DocumentStore } from './document-store.types';

export class MemoryDocumentStore implements DocumentStore {
  private documents: Document[] = [];
  private nextId = 1;

  async create(data: {
    telegram_id: number;
    application_id: number;
    document_type: DocumentType;
    telegram_file_id: string;
    original_file_name: string;
    status?: Document['status'];
  }): Promise<Document> {
    const document: Document = {
      id: this.nextId++,
      telegram_id: data.telegram_id,
      application_id: data.application_id,
      document_type: data.document_type,
      telegram_file_id: data.telegram_file_id,
      original_file_name: data.original_file_name,
      uploaded_at: new Date(),
      status: data.status ?? 'pending',
    };

    this.documents.push(document);
    return { ...document };
  }

  async findByTelegramId(telegramId: number): Promise<Document[]> {
    return this.documents
      .filter((doc) => doc.telegram_id === telegramId)
      .map((doc) => ({ ...doc }))
      .sort((a, b) => b.uploaded_at.getTime() - a.uploaded_at.getTime());
  }

  async findByApplicationId(applicationId: number, telegramId: number): Promise<Document[]> {
    return this.documents
      .filter(
        (doc) => doc.application_id === applicationId && doc.telegram_id === telegramId,
      )
      .map((doc) => ({ ...doc }));
  }

  async exists(
    applicationId: number,
    telegramId: number,
    documentType: DocumentType,
  ): Promise<boolean> {
    return this.documents.some(
      (doc) =>
        doc.application_id === applicationId &&
        doc.telegram_id === telegramId &&
        doc.document_type === documentType,
    );
  }
}
