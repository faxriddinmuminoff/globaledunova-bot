import { describe, it, expect } from 'vitest';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { createDocument } from '../../src/database/repositories/document.repository';
import {
  adminVerifyDocument,
  adminRejectDocument,
} from '../../src/services/admin-document.service';
import { getRecentAuditLogs } from '../../src/audit/audit.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('admin document service', () => {
  useFreshMemoryStorage();

  async function seedDocument() {
    await getOrCreateUser(3001, 'Doc User');
    const app = await createApplication({
      telegram_id: 3001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });
    const doc = await createDocument({
      application_id: app.id,
      telegram_id: 3001,
      document_type: 'passport',
      telegram_file_id: 'file123',
      original_file_name: 'passport.pdf',
      mime_type: 'application/pdf',
      file_size: 1024,
    });
    return doc;
  }

  it('verifies document and audits', async () => {
    const doc = await seedDocument();
    const ok = await adminVerifyDocument(doc.id, 8001);
    expect(ok).toBe(true);

    const logs = await getRecentAuditLogs(5);
    expect(logs.some((l) => l.action === 'document_verified')).toBe(true);
  });

  it('rejects document and audits', async () => {
    const doc = await seedDocument();
    const ok = await adminRejectDocument(doc.id, 8001);
    expect(ok).toBe(true);

    const logs = await getRecentAuditLogs(5);
    expect(logs.some((l) => l.action === 'document_rejected')).toBe(true);
  });

  it('returns false for unknown document', async () => {
    expect(await adminVerifyDocument(99999, 8001)).toBe(false);
  });
});
