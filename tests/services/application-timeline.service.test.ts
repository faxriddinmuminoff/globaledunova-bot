import { describe, it, expect } from 'vitest';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import {
  getApplicationTimeline,
  recordInitialApplicationEvent,
  transitionApplicationStatus,
} from '../../src/services/application-timeline.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('application timeline service', () => {
  useFreshMemoryStorage();

  it('records initial submission event', async () => {
    await getOrCreateUser(1001, 'Test Student');
    const app = await createApplication({
      telegram_id: 1001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    await recordInitialApplicationEvent(app);
    const timeline = await getApplicationTimeline(app.id);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].event_type).toBe('status_change');
    expect(timeline[0].to_status).toBe('submitted');
  });

  it('transitions status and appends timeline', async () => {
    await getOrCreateUser(1002, 'Timeline User');
    const app = await createApplication({
      telegram_id: 1002,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });

    const result = await transitionApplicationStatus({
      applicationId: app.id,
      newStatus: 'reviewing',
      changedBy: 1,
      notify: false,
    });

    expect(result.success).toBe(true);
    expect(result.previousStatus).toBe('submitted');

    const timeline = await getApplicationTimeline(app.id);
    expect(timeline.some((e) => e.to_status === 'reviewing')).toBe(true);
  });
});
