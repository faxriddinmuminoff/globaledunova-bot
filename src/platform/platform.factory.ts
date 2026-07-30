import { config, isProduction } from '../config';
import { logger } from '../logger';
import { HttpPlatformClient } from './http-platform-client';
import { PlatformClient } from './platform-client.interface';
import { StubPlatformClient } from './stub-platform-client';

let client: PlatformClient | null = null;

/**
 * The HTTP client is used only when BOTH the URL and the service token are set.
 * A half-configured integration falls back to the stub rather than starting to
 * throw on every submission — but it says so loudly, and in production that is
 * an error-level line, because a stub in production silently swallows real
 * institutions' applications.
 */
export function getPlatformClient(): PlatformClient {
  if (client) return client;

  const url = config.PLATFORM_URL?.trim();
  const token = config.PLATFORM_SERVICE_TOKEN?.trim();

  if (url && token) {
    client = new HttpPlatformClient({
      baseUrl: url,
      serviceToken: token,
      timeoutMs: config.PLATFORM_TIMEOUT_MS,
    });
    logger.info({ baseUrl: url }, 'Platform client: HTTP');
    return client;
  }

  const reason = !url ? 'PLATFORM_URL is not set' : 'PLATFORM_SERVICE_TOKEN is not set';
  if (isProduction) {
    logger.error(
      { reason },
      'Platform client: STUB in production — submitted applications will NOT reach the platform',
    );
  } else {
    logger.warn({ reason }, 'Platform client: STUB (applications stay in this process)');
  }

  client = new StubPlatformClient();
  return client;
}

export function isPlatformStubbed(): boolean {
  return getPlatformClient().kind === 'stub';
}

export function setPlatformClientForTests(next: PlatformClient | null): void {
  client = next;
}

export function resetPlatformClientForTests(): void {
  client = null;
}
