import { describe, it, expect } from 'vitest';
import { useFreshMemoryStorage } from '../helpers/test-storage';
import { getOrCreateUser } from '../../src/database/repositories/user.repository';
import { createApplication } from '../../src/database/repositories/application.repository';
import { createDocument } from '../../src/database/repositories/document.repository';
import {
  getAnalyticsDashboard,
  getFunnelMetrics,
  getOperationalMetrics,
} from '../../src/analytics/dashboard.service';

describe('analytics dashboard service', () => {
  useFreshMemoryStorage();

  it('builds funnel and operational metrics', async () => {
    await getOrCreateUser(33001, 'Analytics User');
    const app = await createApplication({
      telegram_id: 33001,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'accepted',
    });
    await createDocument({
      telegram_id: 33001,
      application_id: app.id,
      document_type: 'passport',
      telegram_file_id: 'f',
      original_file_name: 'passport.pdf',
    });

    const funnel = await getFunnelMetrics('today');
    expect(funnel.registered).toBe(1);
    expect(funnel.applied).toBe(1);
    expect(funnel.uploadedDocuments).toBe(1);

    const operational = await getOperationalMetrics('today');
    expect(operational.acceptance_rate).toBe(100);

    const dashboard = await getAnalyticsDashboard('today');
    expect(dashboard.charts.funnel.length).toBeGreaterThan(0);
  });
});
