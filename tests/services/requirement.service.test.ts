import { describe, it, expect } from 'vitest';
import {
  buildRequirementChecklist,
  getMissingRequiredDocuments,
  checkDocumentsCompleted,
  areAllRequiredDocumentsPresent,
} from '../../src/services/requirement.service';
import {
  createDocument,
  findDocumentsByApplicationId,
  updateDocumentStatus,
} from '../../src/database/repositories/document.repository';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('requirement service', () => {
  useFreshMemoryStorage();

  it('builds checklist with missing items', async () => {
    const checklist = await buildRequirementChecklist('de-1', []);
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.some((i) => i.state === 'missing')).toBe(true);
  });

  it('detects missing required documents', async () => {
    const missing = await getMissingRequiredDocuments('de-1', []);
    expect(missing.length).toBeGreaterThan(0);
  });

  it('checks document completion status', async () => {
    await getOrCreateUser(16001, 'Req User');
    const app = await createApplication({
      telegram_id: 16001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    expect(await checkDocumentsCompleted(app)).toBe(false);

    const missing = await getMissingRequiredDocuments('de-1', []);
    for (const type of missing) {
      const doc = await createDocument({
        application_id: app.id,
        telegram_id: 16001,
        document_type: type,
        telegram_file_id: `file-${type}`,
        original_file_name: `${type}.pdf`,
        mime_type: 'application/pdf',
        file_size: 100,
      });
      await updateDocumentStatus(doc.id, 'verified');
    }

    const docs = await findDocumentsByApplicationId(app.id);
    const checklist = await buildRequirementChecklist('de-1', docs);
    expect(areAllRequiredDocumentsPresent(checklist)).toBe(true);
  });
});
