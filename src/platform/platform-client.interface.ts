import {
  ApplicationStatusResult,
  CreateApplicationInput,
  CreateApplicationResult,
} from './types';

/**
 * The only surface through which the bot talks to the platform.
 *
 * Two implementations exist, chosen by configuration:
 *   - StubPlatformClient — in-process, used until the platform is deployed and in tests
 *   - HttpPlatformClient — the real one
 *
 * This mirrors the bot's existing memory/postgres store pattern: one interface,
 * two backends, a factory that picks by config. No new architecture is invented.
 */
export interface PlatformClient {
  readonly kind: 'stub' | 'http';

  /**
   * Submit a new organization application.
   *
   * Must be idempotent on `input.idempotencyKey`.
   * Throws PlatformError('stir_taken') when the STIR is already in use.
   */
  createOrganizationApplication(
    input: CreateApplicationInput,
  ): Promise<CreateApplicationResult>;

  /**
   * Read the current status of an application the bot created.
   * Throws PlatformError('not_found') for an unknown id.
   */
  getOrganizationApplicationStatus(applicationId: string): Promise<ApplicationStatusResult>;

  /** Cheap liveness probe. Never throws — returns false when the platform is unreachable. */
  healthCheck(): Promise<boolean>;
}
