import { describe, it, expect } from 'vitest';
import { formatApplicationAlertSummary } from '../../src/admin/formatters';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { findApplicationWithStudentById } from '../../src/database/repositories/admin.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('formatApplicationAlertSummary', () => {
  useFreshMemoryStorage();

  it('formats manager alert', async () => {
    await getOrCreateUser(25001, 'Alert User');
    const app = await createApplication({
      telegram_id: 25001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });
    const enriched = await findApplicationWithStudentById(app.id);
    const text = await formatApplicationAlertSummary(enriched!, 'en');
    expect(text).toContain('Alert User');
  });
});
