import { getRequirementStore } from '../storage';
import { DocumentType } from '../../documents/types';
import { UniversityRequirement } from '../../types/requirements';

export async function getUniversityRequirements(
  universityId: string,
): Promise<UniversityRequirement[]> {
  return getRequirementStore().findByUniversityId(universityId);
}

export async function getRequiredDocumentTypes(
  universityId: string,
): Promise<DocumentType[]> {
  return getRequirementStore().findRequiredDocumentTypes(universityId);
}

export async function setUniversityRequirement(
  universityId: string,
  documentType: DocumentType,
  isRequired: boolean,
): Promise<UniversityRequirement> {
  return getRequirementStore().setRequirement(universityId, documentType, isRequired);
}
