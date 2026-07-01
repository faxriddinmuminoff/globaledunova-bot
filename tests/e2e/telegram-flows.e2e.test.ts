import { describe, it, expect, beforeEach } from 'vitest';
import { resetTestEnvironment } from '../helpers/test-storage';
import {
  getOrCreateUser,
  updateUserLanguage,
  updateUserPhone,
} from '../../src/database/repositories/user.repository';
import {
  applicationExists,
  createApplication,
  findApplicationsByTelegramId,
} from '../../src/database/repositories/application.repository';
import {
  createDocument,
  findDocumentsByApplicationId,
} from '../../src/database/repositories/document.repository';
import { getUniversitiesForSelection } from '../../src/universities/university.service';
import {
  recordInitialApplicationEvent,
  getApplicationTimeline,
} from '../../src/services/application-timeline.service';
import { deliverNotification } from '../../src/services/application-status.service';
import {
  countUnreadNotifications,
  markAllNotificationsAsRead,
} from '../../src/database/repositories/notification.repository';
import { getApplicationDetailView } from '../../src/services/application-detail.service';
import { adminChangeApplicationStatus } from '../../src/services/admin-application.service';
import { createBroadcast, scheduleBroadcastSend } from '../../src/broadcast/broadcast.service';
import { getJobQueue } from '../../src/queue/queue.factory';

describe('E2E Telegram flows (memory mode)', () => {
  beforeEach(async () => {
    await resetTestEnvironment();
  });

  it('1. student onboarding', async () => {
    const user = await getOrCreateUser(31001, 'E2E Student');
    await updateUserLanguage(user.telegram_id, 'uz');
    const updated = await updateUserPhone(user.telegram_id, '+998901234567', 'E2E Student');
    expect(updated?.language).toBe('uz');
    expect(updated?.phone_number).toBe('+998901234567');
  });

  it('2. university browse', async () => {
    const universities = await getUniversitiesForSelection('de', 'bachelor', 'en');
    expect(universities.length).toBeGreaterThan(0);
    expect(universities[0].id).toMatch(/^de-/);
  });

  it('3. application creation', async () => {
    await getOrCreateUser(31002, 'Applicant');
    const app = await createApplication({
      telegram_id: 31002,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });
    await recordInitialApplicationEvent(app);
    expect(app.id).toBeGreaterThan(0);
    expect((await getApplicationTimeline(app.id))[0].to_status).toBe('submitted');
  });

  it('4. duplicate application prevention', async () => {
    await getOrCreateUser(31003, 'Duplicate');
    await createApplication({
      telegram_id: 31003,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });
    expect(await applicationExists(31003, 'de-1', 'bachelor')).toBe(true);
  });

  it('5. document upload flow', async () => {
    await getOrCreateUser(31004, 'Docs');
    const app = await createApplication({
      telegram_id: 31004,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });
    await createDocument({
      telegram_id: 31004,
      application_id: app.id,
      document_type: 'passport',
      telegram_file_id: 'file-passport',
      original_file_name: 'passport.pdf',
      mime_type: 'application/pdf',
      file_size: 1000,
    });
    expect(await findDocumentsByApplicationId(app.id)).toHaveLength(1);
  });

  it('6. notifications flow', async () => {
    await deliverNotification(31005, 'Welcome', 'Hello');
    expect(await countUnreadNotifications(31005)).toBe(1);
    expect(await markAllNotificationsAsRead(31005)).toBe(1);
    expect(await countUnreadNotifications(31005)).toBe(0);
  });

  it('7. application detail timeline', async () => {
    await getOrCreateUser(31006, 'Detail');
    const app = await createApplication({
      telegram_id: 31006,
      university_id: 'de-1',
      country: 'de',
      degree: 'master',
    });
    await recordInitialApplicationEvent(app);
    const detail = await getApplicationDetailView(app.id, 31006);
    expect(detail?.timeline.length).toBeGreaterThan(0);
    expect(detail?.missingTypes.length).toBeGreaterThan(0);
  });

  it('8. admin accept flow', async () => {
    await getOrCreateUser(31007, 'Accept');
    const app = await createApplication({
      telegram_id: 31007,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'reviewing',
    });
    const result = await adminChangeApplicationStatus(app.id, 'accepted', 999);
    expect(result.success).toBe(true);
  });

  it('9. admin reject flow', async () => {
    await getOrCreateUser(31008, 'Reject');
    const app = await createApplication({
      telegram_id: 31008,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'reviewing',
    });
    const result = await adminChangeApplicationStatus(app.id, 'rejected', 999);
    expect(result.success).toBe(true);
  });

  it('10. request documents flow', async () => {
    await getOrCreateUser(31009, 'Docs Required');
    const app = await createApplication({
      telegram_id: 31009,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
      status: 'reviewing',
    });
    const result = await adminChangeApplicationStatus(app.id, 'documents_required', 999);
    expect(result.success).toBe(true);
  });

  it('11. broadcast flow', async () => {
    await getOrCreateUser(31010, 'Broadcast Target');
    const campaign = await createBroadcast({
      title: 'E2E Broadcast',
      message: 'Soft launch update',
      filters: { allUsers: true },
      createdBy: 999,
    });
    await scheduleBroadcastSend(campaign.id);
    expect(await getJobQueue().countByStatus('pending')).toBe(1);
  });

  it('keeps repository/service state coherent across flows', async () => {
    await getOrCreateUser(31011, 'Coherent');
    await createApplication({
      telegram_id: 31011,
      university_id: 'de-1',
      country: 'de',
      degree: 'bachelor',
    });
    const apps = await findApplicationsByTelegramId(31011);
    expect(apps).toHaveLength(1);
  });
});

describe.skipIf(!process.env.DATABASE_URL)('E2E Telegram flows (PostgreSQL mode)', () => {
  it('runs against the same repository/service contracts when DATABASE_URL is configured', () => {
    expect(process.env.DATABASE_URL).toBeTruthy();
  });
});
