import { describe, it, expect } from 'vitest';
import { getApplicationDetailView } from '../../src/services/application-detail.service';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { recordInitialApplicationEvent } from '../../src/services/application-timeline.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('application detail service', () => {
  useFreshMemoryStorage();

  it('returns detail view for owned application', async () => {
    await getOrCreateUser(24001, 'Detail User');
    const app = await createApplication({
      telegram_id: 24001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });
    await recordInitialApplicationEvent(app);

    const view = await getApplicationDetailView(app.id, 24001);
    expect(view).not.toBeNull();
    expect(view!.application.id).toBe(app.id);
    expect(view!.timeline.length).toBeGreaterThan(0);
    expect(view!.checklist.length).toBeGreaterThan(0);
  });

  it('returns null for wrong owner', async () => {
    await getOrCreateUser(24002, 'Owner');
    const app = await createApplication({
      telegram_id: 24002,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });
    expect(await getApplicationDetailView(app.id, 99999)).toBeNull();
  });
});
