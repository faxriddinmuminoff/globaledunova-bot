import { Document, CreateDocumentData } from '../../documents/types';
import { DocumentStore } from './document-store.types';
import { DuplicateDocumentError } from '../postgres-errors';

export class MemoryDocumentStore implements DocumentStore {
  private documents: Document[] = [];
  private nextId = 1;

  async create(data: CreateDocumentData): Promise<Document> {
    if (
      data.checksum &&
      this.documents.some(
        (doc) =>
          doc.application_id === data.application_id &&
          doc.telegram_id === data.telegram_id &&
          doc.checksum === data.checksum,
      )
    ) {
      throw new DuplicateDocumentError();
    }

    const document: Document = {
      id: this.nextId++,
      telegram_id: data.telegram_id,
      application_id: data.application_id,
      document_type: data.document_type,
      telegram_file_id: data.telegram_file_id,
      original_file_name: data.original_file_name,
      uploaded_at: new Date(),
      status: data.status ?? 'pending',
      storage_provider: data.storage_provider ?? 'telegram',
      storage_key: data.storage_key ?? null,
      storage_url: data.storage_url ?? null,
      file_size: data.file_size ?? null,
      mime_type: data.mime_type ?? null,
      checksum: data.checksum ?? null,
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
    documentType: Document['document_type'],
  ): Promise<boolean> {
    return this.documents.some(
      (doc) =>
        doc.application_id === applicationId &&
        doc.telegram_id === telegramId &&
        doc.document_type === documentType,
    );
  }

  async findRecent(limit: number): Promise<Document[]> {
    return this.documents
      .map((doc) => ({ ...doc }))
      .sort((a, b) => b.uploaded_at.getTime() - a.uploaded_at.getTime())
      .slice(0, limit);
  }

  async findByApplicationIdOnly(applicationId: number): Promise<Document[]> {
    return this.documents
      .filter((doc) => doc.application_id === applicationId)
      .map((doc) => ({ ...doc }));
  }

  async findByIdOnly(id: number): Promise<Document | null> {
    const doc = this.documents.find((item) => item.id === id);
    return doc ? { ...doc } : null;
  }

  async updateStatusById(id: number, status: Document['status']): Promise<Document | null> {
    const doc = this.documents.find((item) => item.id === id);
    if (!doc) return null;
    doc.status = status;
    return { ...doc };
  }

  async countByStatus(status: Document['status']): Promise<number> {
    return this.documents.filter((doc) => doc.status === status).length;
  }
}
