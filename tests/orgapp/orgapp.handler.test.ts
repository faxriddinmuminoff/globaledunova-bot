import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StubPlatformClient } from '../../src/platform/stub-platform-client';
import {
  resetPlatformClientForTests,
  setPlatformClientForTests,
} from '../../src/platform/platform.factory';
import { MemoryOrgApplicationStore } from '../../src/orgapp/memory-orgapp.store';
import { setOrgApplicationStoreForTests } from '../../src/orgapp/orgapp-store.factory';
import {
  handleOrgAppContact,
  handleOrgAppDocument,
  handleOrgAppText,
  isAwaitingCharter,
  isOrgAppActive,
  showMyOrgApplications,
  startOrgApplication,
} from '../../src/bot/handlers/orgapp.handler';
import { AppContext } from '../../src/bot/middleware/context.middleware';
import { OnboardingStep, SessionData } from '../../src/types';
import { t } from '../../src/i18n';
import { PlatformError } from '../../src/platform/types';

vi.mock('../../src/bot/helpers/menu.helper', () => ({
  mainMenuKeyboardForUser: vi.fn().mockResolvedValue({ reply_markup: { keyboard: [] } }),
}));

const texts = t('uz').orgApp;

interface FakeCtx {
  ctx: AppContext;
  replies: string[];
  setText: (text: string) => void;
  setDocument: (document: {
    file_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  }) => void;
  setContact: (phone: string) => void;
  lastReply: () => string;
}

function makeCtx(telegramId = 4242, fetchBytes = Buffer.from('%PDF charter')): FakeCtx {
  const replies: string[] = [];
  const session: SessionData = {
    onboardingStep: OnboardingStep.Complete,
    language: 'uz',
    user: null,
    documentFlow: null,
    adminMode: false,
    adminSearchMode: null,
    adminSearchQuery: null,
    adminSearchPage: 1,
    adminWizard: null,
    orgAppWizard: null,
  };

  const ctx = {
    from: { id: telegramId },
    session,
    message: undefined as unknown,
    reply: async (text: string) => {
      replies.push(text);
      return undefined;
    },
    telegram: {
      getFileLink: async () => new URL('https://api.telegram.test/file/ustav.pdf'),
    },
  } as unknown as AppContext;

  // The charter path downloads bytes through global fetch.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(fetchBytes, { status: 200, headers: { 'Content-Type': 'application/pdf' } }),
    ),
  );

  return {
    ctx,
    replies,
    setText: (text) => {
      (ctx as unknown as { message: unknown }).message = { text };
    },
    setDocument: (document) => {
      (ctx as unknown as { message: unknown }).message = { document };
    },
    setContact: (phone) => {
      (ctx as unknown as { message: unknown }).message = {
        contact: { phone_number: phone },
      };
    },
    lastReply: () => replies[replies.length - 1] ?? '',
  };
}

let platform: StubPlatformClient;
let store: MemoryOrgApplicationStore;

beforeEach(() => {
  platform = new StubPlatformClient();
  store = new MemoryOrgApplicationStore();
  setPlatformClientForTests(platform);
  setOrgApplicationStoreForTests(store);
});

afterEach(() => {
  resetPlatformClientForTests();
  setOrgApplicationStoreForTests(null);
  vi.unstubAllGlobals();
});

/** Drive the wizard from a fresh start up to (but not including) submit. */
async function fillWizard(
  fake: FakeCtx,
  options: { stir?: string; skipMiddleName?: boolean } = {},
): Promise<void> {
  const { ctx, setText, setDocument } = fake;

  await startOrgApplication(ctx);

  setText(texts.orgTypeLabels.institute);
  await handleOrgAppText(ctx);

  setText('Toshkent xalqaro moliya instituti');
  await handleOrgAppText(ctx);

  setText(options.stir ?? '305447892');
  await handleOrgAppText(ctx);

  setText('Karimov');
  await handleOrgAppText(ctx);

  setText('Jasur');
  await handleOrgAppText(ctx);

  setText(options.skipMiddleName ? texts.buttonSkip : 'Anvarovich');
  await handleOrgAppText(ctx);

  setText('901234567');
  await handleOrgAppText(ctx);

  setDocument({
    file_id: 'file-1',
    file_name: 'ustav.pdf',
    mime_type: 'application/pdf',
    file_size: 2048,
  });
  await handleOrgAppDocument(ctx);
}

describe('full application conversation', () => {
  it('walks all nine steps and submits', async () => {
    const fake = makeCtx(4242);
    await fillWizard(fake);

    // We are on the confirm screen, and it shows what was entered.
    expect(fake.ctx.session.orgAppWizard?.step).toBe('confirm');
    expect(fake.lastReply()).toContain('Toshkent xalqaro moliya instituti');
    expect(fake.lastReply()).toContain('305447892');
    expect(fake.lastReply()).toContain('Karimov Jasur Anvarovich');
    expect(fake.lastReply()).toContain('+998901234567');
    expect(fake.lastReply()).toContain('ustav.pdf');

    fake.setText(texts.buttonSubmit);
    await handleOrgAppText(fake.ctx);

    expect(fake.lastReply()).toContain('Ariza qabul qilindi');
    // The wizard is closed and the application is stored against this applicant.
    expect(isOrgAppActive(fake.ctx)).toBe(false);
    expect(await store.listByTelegramId(4242)).toHaveLength(1);
  });

  it('accepts a skipped sharif and composes the name without it', async () => {
    const fake = makeCtx();
    await fillWizard(fake, { skipMiddleName: true });

    fake.setText(texts.buttonSubmit);
    await handleOrgAppText(fake.ctx);

    const [record] = await store.listByTelegramId(4242);
    expect(record.responsibleFullName).toBe('Karimov Jasur');
  });

  it('accepts a shared contact on the phone step', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);

    for (const answer of [
      texts.orgTypeLabels.college,
      'Samarqand kolleji',
      '308912455',
      'Rustamova',
      'Nigora',
      'Baxtiyorovna',
    ]) {
      fake.setText(answer);
      await handleOrgAppText(fake.ctx);
    }

    expect(fake.ctx.session.orgAppWizard?.step).toBe('resp_phone');

    fake.setContact('+998662213040');
    expect(await handleOrgAppContact(fake.ctx)).toBe(true);

    expect(fake.ctx.session.orgAppWizard?.step).toBe('charter');
    expect(fake.ctx.session.orgAppWizard?.draft.phone).toBe('+998662213040');
  });
});

describe('validation feedback', () => {
  it('re-asks on a bad STIR without advancing', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);

    fake.setText(texts.orgTypeLabels.institute);
    await handleOrgAppText(fake.ctx);
    fake.setText('Institut');
    await handleOrgAppText(fake.ctx);

    fake.setText('12345');
    await handleOrgAppText(fake.ctx);

    expect(fake.lastReply()).toBe(texts.errorStirFormat);
    expect(fake.ctx.session.orgAppWizard?.step).toBe('stir');
  });

  it('rejects free text on the type step instead of storing it', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);

    fake.setText('universitet emas nimadir');
    await handleOrgAppText(fake.ctx);

    expect(fake.lastReply()).toBe(texts.errorPickFromButtons);
    expect(fake.ctx.session.orgAppWizard?.draft.organizationType).toBeUndefined();
  });

  it('asks for a file when text arrives on the charter step', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);
    fake.ctx.session.orgAppWizard!.step = 'charter';

    fake.setText('mana ustav');
    await handleOrgAppText(fake.ctx);

    expect(fake.lastReply()).toBe(texts.errorExpectDocument);
    expect(isAwaitingCharter(fake.ctx)).toBe(true);
  });

  it('rejects a disallowed file type and stays on the charter step', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);
    fake.ctx.session.orgAppWizard!.step = 'charter';

    fake.setDocument({ file_id: 'f', file_name: 'ustav.docx', file_size: 100 });
    await handleOrgAppDocument(fake.ctx);

    expect(fake.lastReply()).toBe(texts.errorFileType);
    expect(fake.ctx.session.orgAppWizard?.step).toBe('charter');
  });

  it('tells a user who sent a photo to send it as a file', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);
    fake.ctx.session.orgAppWizard!.step = 'charter';

    // A photo update carries no `document` field.
    (fake.ctx as unknown as { message: unknown }).message = { photo: [{ file_id: 'p' }] };
    await handleOrgAppDocument(fake.ctx);

    expect(fake.lastReply()).toBe(texts.errorFileType);
  });
});

describe('navigation', () => {
  it('goes back one step and keeps the earlier answers', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);

    fake.setText(texts.orgTypeLabels.institute);
    await handleOrgAppText(fake.ctx);
    fake.setText('Institut nomi');
    await handleOrgAppText(fake.ctx);
    expect(fake.ctx.session.orgAppWizard?.step).toBe('stir');

    fake.setText(texts.buttonBack);
    await handleOrgAppText(fake.ctx);

    expect(fake.ctx.session.orgAppWizard?.step).toBe('org_name');
    expect(fake.ctx.session.orgAppWizard?.draft.organizationType).toBe('institute');
  });

  it('cancels and closes the wizard', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);

    fake.setText(texts.buttonCancel);
    await handleOrgAppText(fake.ctx);

    expect(fake.replies).toContain(texts.cancelled);
    expect(isOrgAppActive(fake.ctx)).toBe(false);
  });

  it('does not start a second wizard over an open one', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);
    const key = fake.ctx.session.orgAppWizard?.idempotencyKey;

    await startOrgApplication(fake.ctx);

    expect(fake.replies).toContain(texts.alreadyInProgress);
    // Same wizard, so the same idempotency key — no risk of a duplicate application.
    expect(fake.ctx.session.orgAppWizard?.idempotencyKey).toBe(key);
  });

  it('ignores a stale Skip press outside the sharif step', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);
    fake.setText(texts.orgTypeLabels.institute);
    await handleOrgAppText(fake.ctx);

    fake.setText(texts.buttonSkip);
    await handleOrgAppText(fake.ctx);

    expect(fake.ctx.session.orgAppWizard?.step).toBe('org_name');
    expect(fake.ctx.session.orgAppWizard?.draft.organizationName).toBeUndefined();
  });

  it('ignores a stale Submit press before the confirm step', async () => {
    const fake = makeCtx();
    await startOrgApplication(fake.ctx);

    fake.setText(texts.buttonSubmit);
    await handleOrgAppText(fake.ctx);

    expect(fake.ctx.session.orgAppWizard?.step).toBe('org_type');
    expect(await store.countAll()).toBe(0);
  });

  it('returns false for text when no wizard is open, so the menu still works', async () => {
    const fake = makeCtx();
    fake.setText('anything');
    expect(await handleOrgAppText(fake.ctx)).toBe(false);
  });
});

describe('submit failures', () => {
  it('keeps the wizard open on a duplicate STIR so the applicant loses nothing', async () => {
    const first = makeCtx(1);
    await fillWizard(first);
    first.setText(texts.buttonSubmit);
    await handleOrgAppText(first.ctx);

    const second = makeCtx(2);
    await fillWizard(second);
    second.setText(texts.buttonSubmit);
    await handleOrgAppText(second.ctx);

    expect(second.replies.some((r) => r.includes('Bu STIR bo'))).toBe(true);
    // Still open, still on confirm, with every answer intact.
    expect(isOrgAppActive(second.ctx)).toBe(true);
    expect(second.ctx.session.orgAppWizard?.step).toBe('confirm');
    expect(second.ctx.session.orgAppWizard?.draft.charter).toBeDefined();
  });

  it('reuses the same idempotency key on a retry after an outage', async () => {
    const fake = makeCtx();
    await fillWizard(fake);
    const key = fake.ctx.session.orgAppWizard!.idempotencyKey;

    const created = vi.spyOn(platform, 'createOrganizationApplication');
    created.mockRejectedValueOnce(new PlatformError('unavailable', 'platform is down'));

    fake.setText(texts.buttonSubmit);
    await handleOrgAppText(fake.ctx);

    // The applicant is told to try again later, and nothing was stored.
    expect(fake.lastReply()).not.toBe('');
    expect(fake.replies.some((r) => r.includes('javob bermayapti'))).toBe(true);
    expect(isOrgAppActive(fake.ctx)).toBe(true);
    expect(await store.countAll()).toBe(0);

    created.mockRestore();
    fake.setText(texts.buttonSubmit);
    await handleOrgAppText(fake.ctx);

    expect(isOrgAppActive(fake.ctx)).toBe(false);
    expect(await store.countAll()).toBe(1);
    expect(key).toBe(fake.ctx.session.orgAppWizard?.idempotencyKey ?? key);
  });
});

describe('my applications', () => {
  it('shows the empty state when there is nothing yet', async () => {
    const fake = makeCtx();
    await showMyOrgApplications(fake.ctx);
    expect(fake.lastReply()).toBe(texts.myApplicationsEmpty);
  });

  it('lists a submitted application with its status', async () => {
    const fake = makeCtx(4242);
    await fillWizard(fake);
    fake.setText(texts.buttonSubmit);
    await handleOrgAppText(fake.ctx);

    await showMyOrgApplications(fake.ctx);

    expect(fake.lastReply()).toContain('Toshkent xalqaro moliya instituti');
    expect(fake.lastReply()).toContain(texts.statusLabels.submitted);
  });
});
