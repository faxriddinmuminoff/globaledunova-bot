import { describe, it, expect, vi } from 'vitest';
import { sendTelegramMessage } from '../../src/telegram/telegram-client';
import { getMetric, resetMetricsForTests } from '../../src/observability/metrics';

describe('telegram client protection', () => {
  beforeEach(() => resetMetricsForTests());

  it('sends message successfully', async () => {
    const sendMessage = vi.fn().mockResolvedValue({});
    const ok = await sendTelegramMessage({
      bot: { telegram: { sendMessage } },
      chatId: 1,
      text: 'hello',
      maxAttempts: 1,
    });
    expect(ok).toBe(true);
    expect(getMetric('telegram_send_success')).toBe(1);
  });

  it('retries and records failure', async () => {
    const sendMessage = vi.fn().mockRejectedValue(new Error('network'));
    const ok = await sendTelegramMessage({
      bot: { telegram: { sendMessage } },
      chatId: 1,
      text: 'hello',
      maxAttempts: 1,
    });
    expect(ok).toBe(false);
    expect(getMetric('telegram_send_failed')).toBe(1);
  });

  it('supports fake sends', async () => {
    const ok = await sendTelegramMessage({
      bot: null,
      chatId: 1,
      text: 'hello',
      fake: true,
    });
    expect(ok).toBe(true);
  });
});
