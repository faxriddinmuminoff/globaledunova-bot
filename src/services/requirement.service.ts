import { findDocumentsByApplicationId } from '../database/repositories/document.repository';
import { getRequiredDocumentTypes } from '../database/repositories/requirement.repository';
import { Document, DocumentType } from '../documents/types';
import { Application } from '../universities/types';
import {
  buildDocumentChecklist,
  ChecklistItemState,
  DocumentChecklistItem,
} from '../admin/document-checklist';

export async function getRequiredTypesForApplication(
  universityId: string,
): Promise<DocumentType[]> {
  return getRequiredDocumentTypes(universityId);
}

export async function buildRequirementChecklist(
  universityId: string,
  documents: Document[],
): Promise<DocumentChecklistItem[]> {
  const requiredTypes = await getRequiredTypesForApplication(universityId);
  const byType = new Map<DocumentType, Document>();
  for (const doc of documents) {
    byType.set(doc.document_type, doc);
  }

  return requiredTypes.map((documentType) => {
    const document = byType.get(documentType) ?? null;
    let state: ChecklistItemState = 'missing';

    if (document) {
      if (document.status === 'verified') state = 'verified';
      else if (document.status === 'rejected') state = 'rejected';
      else state = 'pending';
    }

    return { documentType, state, document };
  });
}

export async function getMissingRequiredDocuments(
  universityId: string,
  documents: Document[],
): Promise<DocumentType[]> {
  const checklist = await buildRequirementChecklist(universityId, documents);
  return checklist.filter((item) => item.state === 'missing').map((item) => item.documentType);
}

export async function checkDocumentsCompleted(application: Application): Promise<boolean> {
  const documents = await findDocumentsByApplicationId(application.id);
  const missing = await getMissingRequiredDocuments(application.university_id, documents);
  const hasRejected = (await buildRequirementChecklist(application.university_id, documents)).some(
    (item) => item.state === 'rejected',
  );
  if (hasRejected) return false;

  const requiredPending = (await buildRequirementChecklist(application.university_id, documents))
    .filter((item) => item.state === 'pending' || item.state === 'verified');
  const requiredTypes = await getRequiredTypesForApplication(application.university_id);

  return (
    missing.length === 0 &&
    requiredTypes.every((type) => {
      const item = requiredPending.find((i) => i.documentType === type);
      return item && (item.state === 'verified' || item.state === 'pending');
    })
  );
}

export function areAllRequiredDocumentsPresent(
  checklist: DocumentChecklistItem[],
): boolean {
  return checklist.every((item) => item.state !== 'missing' && item.state !== 'rejected');
}

// Re-export for convenience
export { buildDocumentChecklist };
