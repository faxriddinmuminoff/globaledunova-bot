import { describe, it, expect, vi, afterEach } from 'vitest';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { processDocumentReminders } from '../../src/services/reminder.service';
import { findApplicationEvents } from '../../src/database/repositories/application-event.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('reminder service', () => {
  useFreshMemoryStorage();

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips accepted applications', async () => {
    await getOrCreateUser(9001, 'Reminder User');
    const app = await createApplication({
      telegram_id: 9001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'accepted',
    });

    await processDocumentReminders();
    const events = await findApplicationEvents(app.id);
    expect(events.filter((e) => e.event_type.startsWith('reminder'))).toHaveLength(0);
  });

  it('creates 3-day reminder for stale documents_required applications', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

    await getOrCreateUser(9002, 'Stale User');
    const app = await createApplication({
      telegram_id: 9002,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'documents_required',
    });

    vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    await processDocumentReminders();

    const events = await findApplicationEvents(app.id);
    expect(events.some((e) => e.event_type === 'reminder_3d')).toBe(true);
  });
});
