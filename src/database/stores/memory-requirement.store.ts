import { DocumentType, DOCUMENT_TYPES } from '../../documents/types';
import { UniversityRequirement } from '../../types/requirements';
import { RequirementStore } from './requirement-store.types';

export class MemoryRequirementStore implements RequirementStore {
  private requirements = new Map<string, UniversityRequirement>();
  private nextId = 1;

  private key(universityId: string, documentType: DocumentType): string {
    return `${universityId}:${documentType}`;
  }

  async findByUniversityId(universityId: string): Promise<UniversityRequirement[]> {
    return [...this.requirements.values()]
      .filter((r) => r.university_id === universityId)
      .map((r) => ({ ...r }));
  }

  async findRequiredDocumentTypes(universityId: string): Promise<DocumentType[]> {
    const reqs = await this.findByUniversityId(universityId);
    if (reqs.length === 0) {
      return [...DOCUMENT_TYPES];
    }
    return reqs.filter((r) => r.is_required).map((r) => r.document_type);
  }

  async setRequirement(
    universityId: string,
    documentType: DocumentType,
    isRequired: boolean,
  ): Promise<UniversityRequirement> {
    const mapKey = this.key(universityId, documentType);
    const existing = this.requirements.get(mapKey);
    const now = new Date();

    const req: UniversityRequirement = existing
      ? { ...existing, is_required: isRequired, updated_at: now }
      : {
          id: this.nextId++,
          university_id: universityId,
          document_type: documentType,
          is_required: isRequired,
          created_at: now,
          updated_at: now,
        };

    this.requirements.set(mapKey, req);
    return { ...req };
  }

  async seedDefaults(universityIds: string[], documentTypes: DocumentType[]): Promise<void> {
    for (const universityId of universityIds) {
      for (const documentType of documentTypes) {
        await this.setRequirement(universityId, documentType, true);
      }
    }
  }
}
