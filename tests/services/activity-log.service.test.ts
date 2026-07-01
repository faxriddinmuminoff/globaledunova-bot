import { describe, it, expect } from 'vitest';
import {
  logUserRegistered,
  logApplicationCreated,
  logDocumentUploaded,
  logStatusChanged,
} from '../../src/services/activity-log.service';
import { findRecentActivityLogs } from '../../src/database/repositories/activity-log.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('activity log service', () => {
  useFreshMemoryStorage();

  it('logs user registration', async () => {
    await logUserRegistered(17001);
    const logs = await findRecentActivityLogs(5);
    expect(logs.some((l) => l.action === 'user_registered')).toBe(true);
  });

  it('logs application creation', async () => {
    await logApplicationCreated(17002, 42);
    const logs = await findRecentActivityLogs(5);
    expect(logs.some((l) => l.action === 'application_created')).toBe(true);
  });

  it('logs document upload and status change', async () => {
    await logDocumentUploaded(17003, 1, 10);
    await logStatusChanged(17003, 10, 'submitted', 'reviewing', 9001);
    const logs = await findRecentActivityLogs(10);
    expect(logs.some((l) => l.action === 'document_uploaded')).toBe(true);
    expect(logs.some((l) => l.action === 'status_changed')).toBe(true);
  });
});
