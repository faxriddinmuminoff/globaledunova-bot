import { logger } from '../logger';
import { PlatformClient } from './platform-client.interface';
import {
  ApplicationStatusResult,
  CreateApplicationInput,
  CreateApplicationResult,
  PlatformError,
  PlatformErrorCode,
  isApplicationStatus,
} from './types';

export interface HttpPlatformClientOptions {
  baseUrl: string;
  serviceToken: string;
  timeoutMs: number;
}

const APPLICATIONS_PATH = '/integrations/telegram/organization-applications';

/**
 * The real client.
 *
 * Deliberate choices:
 *   - The bot POLLS; the platform never calls the bot. The platform is a JSON-file
 *     app with no outbound worker, and for most of its life it will sit behind NAT.
 *     Polling means zero outbound work on the platform side.
 *   - The service token authorises exactly two routes. It is not a user credential
 *     and carries no tenant scope.
 *   - Every non-2xx maps to a typed PlatformError so the handler layer can decide
 *     what the applicant is told, in their own language.
 */
export class HttpPlatformClient implements PlatformClient {
  readonly kind = 'http' as const;

  private readonly baseUrl: string;
  private readonly serviceToken: string;
  private readonly timeoutMs: number;

  constructor(options: HttpPlatformClientOptions) {
    // Strip a trailing slash so path joining can never produce a double slash.
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.serviceToken = options.serviceToken;
    this.timeoutMs = options.timeoutMs;
  }

  async createOrganizationApplication(
    input: CreateApplicationInput,
  ): Promise<CreateApplicationResult> {
    const { idempotencyKey, ...payload } = input;

    const response = await this.request(APPLICATIONS_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ source: 'telegram-bot', ...payload }),
    });

    const body = await this.readJson(response);

    if (!response.ok) {
      throw this.toError(response.status, body);
    }

    const applicationId = typeof body?.applicationId === 'string' ? body.applicationId : '';
    const status = typeof body?.status === 'string' ? body.status : '';

    if (!applicationId || !isApplicationStatus(status)) {
      throw new PlatformError(
        'unknown',
        'Platform returned an application without a usable id or status',
        { httpStatus: response.status },
      );
    }

    return {
      applicationId,
      status,
      createdAt:
        typeof body?.createdAt === 'string' ? body.createdAt : new Date().toISOString(),
    };
  }

  async getOrganizationApplicationStatus(
    applicationId: string,
  ): Promise<ApplicationStatusResult> {
    const response = await this.request(
      `${APPLICATIONS_PATH}/${encodeURIComponent(applicationId)}`,
      { method: 'GET' },
    );

    const body = await this.readJson(response);

    if (!response.ok) {
      throw this.toError(response.status, body);
    }

    const status = typeof body?.status === 'string' ? body.status : '';
    if (!isApplicationStatus(status)) {
      throw new PlatformError('unknown', `Platform returned unknown status "${status}"`, {
        httpStatus: response.status,
      });
    }

    return {
      applicationId,
      status,
      rejectionReason:
        typeof body?.rejectionReason === 'string' ? body.rejectionReason : undefined,
      organizationId:
        typeof body?.organizationId === 'string' ? body.organizationId : undefined,
      updatedAt:
        typeof body?.updatedAt === 'string' ? body.updatedAt : new Date().toISOString(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request(`${APPLICATIONS_PATH}/health`, { method: 'GET' });
      return response.ok;
    } catch (error) {
      logger.warn({ error }, 'Platform health check failed');
      return false;
    }
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.serviceToken}`,
          Accept: 'application/json',
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new PlatformError('timeout', `Platform request timed out after ${this.timeoutMs}ms`);
      }
      throw new PlatformError(
        'unavailable',
        `Platform is unreachable: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async readJson(response: Response): Promise<Record<string, unknown> | null> {
    try {
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      // A non-JSON body is not fatal on its own — the status code still decides.
      return null;
    }
  }

  private toError(httpStatus: number, body: Record<string, unknown> | null): PlatformError {
    const declared = typeof body?.error === 'string' ? body.error : '';
    const message =
      typeof body?.message === 'string' ? body.message : `Platform responded ${httpStatus}`;
    const fields =
      body?.fields && typeof body.fields === 'object'
        ? (body.fields as Record<string, string>)
        : undefined;

    let code: PlatformErrorCode;
    if (declared === 'stir_taken') code = 'stir_taken';
    else if (httpStatus === 409) code = 'stir_taken';
    else if (httpStatus === 401 || httpStatus === 403) code = 'unauthorized';
    else if (httpStatus === 404) code = 'not_found';
    else if (httpStatus === 422 || httpStatus === 400) code = 'validation_failed';
    else if (httpStatus >= 500) code = 'unavailable';
    else code = 'unknown';

    return new PlatformError(code, message, { httpStatus, fields });
  }
}
