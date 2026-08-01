import { describe, it, expect, vi, afterEach } from 'vitest';
import { HttpPlatformClient } from '../../src/platform/http-platform-client';
import { CreateApplicationInput, PlatformError } from '../../src/platform/types';

const BASE = 'https://platform.example.test';

function client(timeoutMs = 5000): HttpPlatformClient {
  return new HttpPlatformClient({
    baseUrl: `${BASE}/`, // trailing slash on purpose — must not produce a double slash
    serviceToken: 'service-token-value',
    timeoutMs,
  });
}

function input(overrides: Partial<CreateApplicationInput> = {}): CreateApplicationInput {
  return {
    idempotencyKey: 'idem-123',
    organizationName: 'Samarqand iqtisodiyot kolleji',
    organizationType: 'college',
    stir: '308912455',
    responsiblePersonName: 'Rustamova Nigora Baxtiyorovna',
    phone: '+998662213040',
    contactTelegramId: 777,
    documents: [
      {
        documentType: 'charter',
        storageRef: 'local://org-apps/2026/cd34.pdf',
        uploadedAt: '2026-07-30T10:00:00.000Z',
        sha256: 'b'.repeat(64),
      },
    ],
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HttpPlatformClient — request shape', () => {
  it('posts to the integration route with auth and idempotency headers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(201, {
          applicationId: 'app-1',
          status: 'submitted',
          createdAt: '2026-07-30T10:00:00.000Z',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await client().createOrganizationApplication(input());

    expect(result).toEqual({
      applicationId: 'app-1',
      status: 'submitted',
      createdAt: '2026-07-30T10:00:00.000Z',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/integrations/telegram/organization-applications`);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer service-token-value');
    expect(init.headers['Idempotency-Key']).toBe('idem-123');

    const body = JSON.parse(init.body as string);
    expect(body.source).toBe('telegram-bot');
    // The key travels as a header, not in the body.
    expect(body.idempotencyKey).toBeUndefined();
    // The platform stores ONE name string and a top-level phone; the bot composes
    // the three parts it collected rather than making the platform split them.
    expect(body.responsiblePersonName).toBe('Rustamova Nigora Baxtiyorovna');
    expect(body.phone).toBe('+998662213040');
    expect(body.responsible).toBeUndefined();
  });

  it('url-encodes the application id when reading status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { status: 'platform_admin_review', updatedAt: '2026-07-30T11:00:00.000Z' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const status = await client().getOrganizationApplicationStatus('a b/c');

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${BASE}/integrations/telegram/organization-applications/a%20b%2Fc`,
    );
    expect(status.status).toBe('platform_admin_review');
  });
});

describe('HttpPlatformClient — error mapping', () => {
  it.each([
    [409, { error: 'stir_taken' }, 'stir_taken'],
    [409, {}, 'stir_taken'],
    [401, {}, 'unauthorized'],
    [403, {}, 'unauthorized'],
    [404, {}, 'not_found'],
    [422, {}, 'validation_failed'],
    [400, {}, 'validation_failed'],
    [500, {}, 'unavailable'],
    [503, {}, 'unavailable'],
    [418, {}, 'unknown'],
  ])('maps HTTP %i to %s', async (status, body, expected) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(status, body)));

    await expect(
      client().createOrganizationApplication(input()),
    ).rejects.toMatchObject({ code: expected, httpStatus: status });
  });

  it('surfaces per-field validation detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(422, {
          error: 'validation_failed',
          message: 'STIR noto‘g‘ri',
          fields: { stir: 'must be 9-14 digits' },
        }),
      ),
    );

    try {
      await client().createOrganizationApplication(input());
      expect.unreachable('should have thrown');
    } catch (error) {
      const platformError = error as PlatformError;
      expect(platformError.fields).toEqual({ stir: 'must be 9-14 digits' });
      expect(platformError.message).toBe('STIR noto‘g‘ri');
    }
  });

  it('treats a network failure as retryable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    try {
      await client().createOrganizationApplication(input());
      expect.unreachable('should have thrown');
    } catch (error) {
      const platformError = error as PlatformError;
      expect(platformError.code).toBe('unavailable');
      expect(platformError.isRetryable).toBe(true);
    }
  });

  it('treats an abort as a timeout, and as retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      }),
    );

    try {
      await client().createOrganizationApplication(input());
      expect.unreachable('should have thrown');
    } catch (error) {
      const platformError = error as PlatformError;
      expect(platformError.code).toBe('timeout');
      expect(platformError.isRetryable).toBe(true);
    }
  });

  it('rejects a 2xx body that carries an unknown status instead of trusting it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { status: 'totally_new_stage' })),
    );

    await expect(
      client().getOrganizationApplicationStatus('app-1'),
    ).rejects.toMatchObject({ code: 'unknown' });
  });

  it('rejects a 2xx create response missing the application id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(201, { status: 'submitted' })));

    await expect(
      client().createOrganizationApplication(input()),
    ).rejects.toMatchObject({ code: 'unknown' });
  });

  it('does not crash on a non-JSON error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>502 Bad Gateway</html>', { status: 502 })),
    );

    await expect(
      client().createOrganizationApplication(input()),
    ).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('healthCheck returns false instead of throwing when unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await client().healthCheck()).toBe(false);
  });
});
