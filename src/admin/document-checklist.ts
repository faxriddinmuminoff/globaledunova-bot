import { Document, DocumentType, DOCUMENT_TYPES } from '../documents/types';
import { Language } from '../types';
import { t } from '../i18n';

export type ChecklistItemState = 'missing' | 'pending' | 'verified' | 'rejected';

export interface DocumentChecklistItem {
  documentType: DocumentType;
  state: ChecklistItemState;
  document: Document | null;
}

export function buildDocumentChecklist(documents: Document[]): DocumentChecklistItem[] {
  const byType = new Map<DocumentType, Document>();
  for (const doc of documents) {
    byType.set(doc.document_type, doc);
  }

  return DOCUMENT_TYPES.map((documentType) => {
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

export function formatChecklistLine(
  language: Language,
  item: DocumentChecklistItem,
): string {
  const texts = t(language);
  const label = texts.documentTypes[item.documentType];
  const icon = texts.adminChecklistIcon(item.state);
  return `${icon} ${label}`;
}

export function formatDocumentChecklist(
  language: Language,
  documents: Document[],
): string {
  const items = buildDocumentChecklist(documents);
  return items.map((item) => formatChecklistLine(language, item)).join('\n');
}

export function formatUploadedDocumentsList(
  language: Language,
  documents: Document[],
): string {
  const texts = t(language);
  if (documents.length === 0) {
    return texts.adminNoUploadedDocuments;
  }

  return documents
    .map((doc) => {
      const label = texts.documentTypes[doc.document_type];
      const statusIcon = texts.adminChecklistIcon(
        doc.status === 'verified'
          ? 'verified'
          : doc.status === 'rejected'
            ? 'rejected'
            : 'pending',
      );
      return `${statusIcon} ${label} — ${doc.original_file_name}`;
    })
    .join('\n');
}

export function formatMissingDocumentsList(
  language: Language,
  documents: Document[],
): string {
  const texts = t(language);
  const missing = buildDocumentChecklist(documents).filter((item) => item.state === 'missing');

  if (missing.length === 0) {
    return texts.adminAllDocumentsUploaded;
  }

  return missing
    .map((item) => `❌ ${texts.documentTypes[item.documentType]}`)
    .join('\n');
}
