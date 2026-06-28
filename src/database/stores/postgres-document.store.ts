import { query, queryOne } from '../index';
import { DuplicateDocumentError, isUniqueViolation } from '../postgres-errors';
import { Document, DocumentStatus, DocumentType } from '../../documents/types';
import { DocumentStore } from './document-store.types';

interface DocumentRow {
  id: number;
  telegram_id: string;
  application_id: number;
  document_type: DocumentType;
  telegram_file_id: string;
  original_file_name: string;
  uploaded_at: Date;
  status: DocumentStatus;
}

function mapDocument(row: DocumentRow): Document {
  return {
    ...row,
    telegram_id: Number(row.telegram_id),
  };
}

export class PostgresDocumentStore implements DocumentStore {
  async create(data: {
    telegram_id: number;
    application_id: number;
    document_type: DocumentType;
    telegram_file_id: string;
    original_file_name: string;
    status?: DocumentStatus;
  }): Promise<Document> {
    try {
      const row = await queryOne<DocumentRow>(
        `INSERT INTO documents (
           telegram_id, application_id, document_type,
           telegram_file_id, original_file_name, status
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.telegram_id,
          data.application_id,
          data.document_type,
          data.telegram_file_id,
          data.original_file_name,
          data.status ?? 'pending',
        ],
      );

      if (!row) {
        throw new Error('Failed to create document');
      }

      return mapDocument(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateDocumentError();
      }
      throw error;
    }
  }

  async findByTelegramId(telegramId: number): Promise<Document[]> {
    const rows = await query<DocumentRow>(
      `SELECT * FROM documents
       WHERE telegram_id = $1
       ORDER BY uploaded_at DESC`,
      [telegramId],
    );
    return rows.map(mapDocument);
  }

  async findByApplicationId(
    applicationId: number,
    telegramId: number,
  ): Promise<Document[]> {
    const rows = await query<DocumentRow>(
      `SELECT * FROM documents
       WHERE application_id = $1 AND telegram_id = $2`,
      [applicationId, telegramId],
    );
    return rows.map(mapDocument);
  }

  async exists(
    applicationId: number,
    telegramId: number,
    documentType: DocumentType,
  ): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM documents
         WHERE application_id = $1 AND telegram_id = $2 AND document_type = $3
       ) AS exists`,
      [applicationId, telegramId, documentType],
    );
    return row?.exists ?? false;
  }
}
