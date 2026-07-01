import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleAdminAccept,
  handleAdminReject,
  handleAdminDocVerify,
  handleAdminDocReject,
} from '../../src/bot/handlers/admin.handler';
import { upsertAdminUser, clearMemoryAdminsForTests } from '../../src/rbac/rbac.service';
import { useFreshMemoryStorage } from '../helpers/test-storage';
import {
  ADMIN_ACCEPT_PREFIX,
  ADMIN_REJECT_PREFIX,
  ADMIN_DOC_VERIFY_PREFIX,
  ADMIN_DOC_REJECT_PREFIX,
} from '../../src/admin/types';

function buildCallbackCtx(telegramId: number, data: string) {
  const answerCbQuery = vi.fn().mockResolvedValue(undefined);
  const reply = vi.fn().mockResolvedValue(undefined);
  const editMessageText = vi.fn().mockResolvedValue(undefined);

  return {
    from: { id: telegramId },
    callbackQuery: { data, message: { text: 'summary' } },
    answerCbQuery,
    reply,
    editMessageText,
    session: {},
  } as never;
}

describe('admin handler RBAC', () => {
  useFreshMemoryStorage();

  beforeEach(() => {
    clearMemoryAdminsForTests();
  });

  it('reviewer cannot accept applications', async () => {
    await upsertAdminUser(15001, 'reviewer');
    const ctx = buildCallbackCtx(15001, `${ADMIN_ACCEPT_PREFIX}999`);

    await handleAdminAccept(ctx);

    expect(ctx.answerCbQuery).toHaveBeenCalledWith();
    expect(ctx.editMessageText).not.toHaveBeenCalled();
  });

  it('reviewer cannot reject applications', async () => {
    await upsertAdminUser(15002, 'reviewer');
    const ctx = buildCallbackCtx(15002, `${ADMIN_REJECT_PREFIX}999`);

    await handleAdminReject(ctx);

    expect(ctx.answerCbQuery).toHaveBeenCalledWith();
    expect(ctx.editMessageText).not.toHaveBeenCalled();
  });

  it('reviewer cannot verify documents', async () => {
    await upsertAdminUser(15003, 'reviewer');
    const ctx = buildCallbackCtx(15003, `${ADMIN_DOC_VERIFY_PREFIX}42`);

    await handleAdminDocVerify(ctx);

    expect(ctx.answerCbQuery).toHaveBeenCalledWith();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('reviewer cannot reject documents', async () => {
    await upsertAdminUser(15004, 'reviewer');
    const ctx = buildCallbackCtx(15004, `${ADMIN_DOC_REJECT_PREFIX}42`);

    await handleAdminDocReject(ctx);

    expect(ctx.answerCbQuery).toHaveBeenCalledWith();
    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
