import { DocumentType } from '../../documents/types';
import { UniversityRequirement } from '../../types/requirements';

export interface RequirementStore {
  findByUniversityId(universityId: string): Promise<UniversityRequirement[]>;

  findRequiredDocumentTypes(universityId: string): Promise<DocumentType[]>;

  setRequirement(
    universityId: string,
    documentType: DocumentType,
    isRequired: boolean,
  ): Promise<UniversityRequirement>;

  seedDefaults(universityIds: string[], documentTypes: DocumentType[]): Promise<void>;
}
