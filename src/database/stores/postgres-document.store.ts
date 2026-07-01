import { query, queryOne } from '../index';
import { DuplicateDocumentError, isUniqueViolation } from '../postgres-errors';
import { Document, DocumentStatus, CreateDocumentData } from '../../documents/types';
import { DocumentStore } from './document-store.types';

interface DocumentRow {
  id: number;
  telegram_id: string;
  application_id: number;
  document_type: Document['document_type'];
  telegram_file_id: string;
  original_file_name: string;
  uploaded_at: Date;
  status: DocumentStatus;
  storage_provider: Document['storage_provider'];
  storage_key: string | null;
  storage_url: string | null;
  file_size: string | null;
  mime_type: string | null;
  checksum: string | null;
}

function mapDocument(row: DocumentRow): Document {
  return {
    ...row,
    telegram_id: Number(row.telegram_id),
    file_size: row.file_size !== null ? Number(row.file_size) : null,
  };
}

export class PostgresDocumentStore implements DocumentStore {
  async create(data: CreateDocumentData): Promise<Document> {
    try {
      const row = await queryOne<DocumentRow>(
        `INSERT INTO documents (
           telegram_id, application_id, document_type,
           telegram_file_id, original_file_name, status,
           storage_provider, storage_key, storage_url, file_size, mime_type, checksum
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          data.telegram_id,
          data.application_id,
          data.document_type,
          data.telegram_file_id,
          data.original_file_name,
          data.status ?? 'pending',
          data.storage_provider ?? 'telegram',
          data.storage_key ?? null,
          data.storage_url ?? null,
          data.file_size ?? null,
          data.mime_type ?? null,
          data.checksum ?? null,
        ],
      );

      if (!row) throw new Error('Failed to create document');
      return mapDocument(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new DuplicateDocumentError();
      throw error;
    }
  }

  async findByTelegramId(telegramId: number): Promise<Document[]> {
    const rows = await query<DocumentRow>(
      `SELECT * FROM documents WHERE telegram_id = $1 ORDER BY uploaded_at DESC`,
      [telegramId],
    );
    return rows.map(mapDocument);
  }

  async findByApplicationId(applicationId: number, telegramId: number): Promise<Document[]> {
    const rows = await query<DocumentRow>(
      `SELECT * FROM documents WHERE application_id = $1 AND telegram_id = $2`,
      [applicationId, telegramId],
    );
    return rows.map(mapDocument);
  }

  async exists(
    applicationId: number,
    telegramId: number,
    documentType: Document['document_type'],
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

  async findRecent(limit: number): Promise<Document[]> {
    const rows = await query<DocumentRow>(
      `SELECT * FROM documents ORDER BY uploaded_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(mapDocument);
  }

  async findByApplicationIdOnly(applicationId: number): Promise<Document[]> {
    const rows = await query<DocumentRow>(
      `SELECT * FROM documents WHERE application_id = $1 ORDER BY uploaded_at DESC`,
      [applicationId],
    );
    return rows.map(mapDocument);
  }

  async findByIdOnly(id: number): Promise<Document | null> {
    const row = await queryOne<DocumentRow>(`SELECT * FROM documents WHERE id = $1`, [id]);
    return row ? mapDocument(row) : null;
  }

  async updateStatusById(id: number, status: DocumentStatus): Promise<Document | null> {
    const row = await queryOne<DocumentRow>(
      `UPDATE documents SET status = $2 WHERE id = $1 RETURNING *`,
      [id, status],
    );
    return row ? mapDocument(row) : null;
  }

  async countByStatus(status: DocumentStatus): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM documents WHERE status = $1`,
      [status],
    );
    return Number(row?.count ?? 0);
  }
}
