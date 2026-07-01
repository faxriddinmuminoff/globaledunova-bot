import { query, queryOne } from '../index';
import { DocumentType, DOCUMENT_TYPES } from '../../documents/types';
import { UniversityRequirement } from '../../types/requirements';
import { RequirementStore } from './requirement-store.types';

interface RequirementRow {
  id: number;
  university_id: string;
  document_type: DocumentType;
  is_required: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRequirement(row: RequirementRow): UniversityRequirement {
  return { ...row };
}

export class PostgresRequirementStore implements RequirementStore {
  async findByUniversityId(universityId: string): Promise<UniversityRequirement[]> {
    const rows = await query<RequirementRow>(
      `SELECT * FROM university_requirements
       WHERE university_id = $1
       ORDER BY document_type`,
      [universityId],
    );
    return rows.map(mapRequirement);
  }

  async findRequiredDocumentTypes(universityId: string): Promise<DocumentType[]> {
    const rows = await query<{ document_type: DocumentType }>(
      `SELECT document_type FROM university_requirements
       WHERE university_id = $1 AND is_required = TRUE
       ORDER BY document_type`,
      [universityId],
    );
    return rows.map((r) => r.document_type);
  }

  async setRequirement(
    universityId: string,
    documentType: DocumentType,
    isRequired: boolean,
  ): Promise<UniversityRequirement> {
    const row = await queryOne<RequirementRow>(
      `INSERT INTO university_requirements (university_id, document_type, is_required)
       VALUES ($1, $2, $3)
       ON CONFLICT (university_id, document_type)
       DO UPDATE SET is_required = $3, updated_at = NOW()
       RETURNING *`,
      [universityId, documentType, isRequired],
    );

    if (!row) throw new Error('Failed to set university requirement');
    return mapRequirement(row);
  }

  async seedDefaults(universityIds: string[], documentTypes: DocumentType[]): Promise<void> {
    for (const universityId of universityIds) {
      for (const documentType of documentTypes) {
        await this.setRequirement(universityId, documentType, true);
      }
    }
  }
}

export const DEFAULT_REQUIREMENT_DOC_TYPES: DocumentType[] = [...DOCUMENT_TYPES];
