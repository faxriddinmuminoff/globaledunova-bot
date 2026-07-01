import { describe, it, expect } from 'vitest';
import {
  getDegreeLabel,
  formatAdminDate,
  formatApplicationSummary,
} from '../../src/admin/formatters';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { findApplicationWithStudentById } from '../../src/database/repositories/admin.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('admin formatters', () => {
  useFreshMemoryStorage();

  it('formats degree labels', () => {
    expect(getDegreeLabel('en', 'bachelor')).toContain('Bachelor');
  });

  it('formats admin dates', () => {
    const formatted = formatAdminDate(new Date('2024-06-15T10:30:00Z'), 'en');
    expect(formatted).toMatch(/2024/);
  });

  it('formats application summary', async () => {
    await getOrCreateUser(15001, 'Format User');
    const app = await createApplication({
      telegram_id: 15001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'reviewing',
    });
    const enriched = await findApplicationWithStudentById(app.id);
    expect(enriched).not.toBeNull();
    const summary = await formatApplicationSummary(enriched!, 'en');
    expect(summary).toContain('Format User');
    expect(summary).toContain('Munich');
  });
});
