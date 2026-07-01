import { describe, it, expect } from 'vitest';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import {
  createDocument,
  findDocumentsByApplicationId,
  updateDocumentStatus,
} from '../../src/database/repositories/document.repository';
import { isDuplicateDocumentError } from '../../src/database/postgres-errors';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('document repository', () => {
  useFreshMemoryStorage();

  it('creates and lists documents', async () => {
    await getOrCreateUser(11001, 'Doc Repo');
    const app = await createApplication({
      telegram_id: 11001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    const doc = await createDocument({
      application_id: app.id,
      telegram_id: 11001,
      document_type: 'passport',
      telegram_file_id: 'abc',
      original_file_name: 'passport.pdf',
      mime_type: 'application/pdf',
      file_size: 500,
    });

    const docs = await findDocumentsByApplicationId(app.id);
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe(doc.id);

    const updated = await updateDocumentStatus(doc.id, 'verified');
    expect(updated?.status).toBe('verified');
  });

  it('rejects duplicate upload checksums for the same application and user', async () => {
    await getOrCreateUser(11002, 'Checksum Repo');
    const app = await createApplication({
      telegram_id: 11002,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    await createDocument({
      application_id: app.id,
      telegram_id: 11002,
      document_type: 'passport',
      telegram_file_id: 'file-1',
      original_file_name: 'passport.pdf',
      mime_type: 'application/pdf',
      file_size: 500,
      checksum: 'same-checksum',
    });

    try {
      await createDocument({
        application_id: app.id,
        telegram_id: 11002,
        document_type: 'diploma',
        telegram_file_id: 'file-2',
        original_file_name: 'diploma.pdf',
        mime_type: 'application/pdf',
        file_size: 600,
        checksum: 'same-checksum',
      });
      throw new Error('Expected duplicate document error');
    } catch (error) {
      expect(isDuplicateDocumentError(error)).toBe(true);
    }
  });
});
