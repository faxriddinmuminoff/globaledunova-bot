import { findApplicationById } from '../database/repositories/application.repository';
import { findDocumentsByApplicationId } from '../database/repositories/document.repository';
import { getApplicationTimeline } from './application-timeline.service';
import { buildRequirementChecklist } from './requirement.service';
import { ApplicationEvent } from '../types/events';
import { DocumentChecklistItem } from '../admin/document-checklist';
import { Document } from '../documents/types';
import { Application } from '../universities/types';

export interface ApplicationDetailView {
  application: Application;
  timeline: ApplicationEvent[];
  checklist: DocumentChecklistItem[];
  documents: Document[];
  missingTypes: string[];
}

export async function getApplicationDetailView(
  applicationId: number,
  telegramId: number,
): Promise<ApplicationDetailView | null> {
  const application = await findApplicationById(applicationId, telegramId);
  if (!application) return null;

  const [timeline, documents] = await Promise.all([
    getApplicationTimeline(applicationId),
    findDocumentsByApplicationId(applicationId),
  ]);

  const checklist = await buildRequirementChecklist(application.university_id, documents);
  const missingTypes = checklist
    .filter((item) => item.state === 'missing')
    .map((item) => item.documentType);

  return { application, timeline, checklist, documents, missingTypes };
}
