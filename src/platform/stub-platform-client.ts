import { randomUUID } from 'node:crypto';
import { logger } from '../logger';
import { PlatformClient } from './platform-client.interface';
import {
  ApplicationStatusResult,
  CreateApplicationInput,
  CreateApplicationResult,
  PlatformApplicationStatus,
  PlatformError,
  isValidStir,
} from './types';

interface StubRecord {
  applicationId: string;
  idempotencyKey: string;
  stir: string;
  status: PlatformApplicationStatus;
  rejectionReason?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * In-process stand-in for the platform.
 *
 * It exists because the platform currently runs on the owner's machine at
 * localhost:3000 while the bot runs on a droplet — today they cannot talk. The
 * whole applicant flow is built and tested against this, then the HTTP client is
 * switched on by setting PLATFORM_URL.
 *
 * It deliberately reproduces the three platform behaviours that shape the UX:
 *   1. idempotency on the submission key
 *   2. STIR uniqueness -> 409 stir_taken (the platform has no archive route yet)
 *   3. strict STIR format (numeric, 9-14 digits)
 *
 * State is per-process and NOT persisted: restarting the bot clears it. That is
 * intentional — it must never be mistaken for a real backing store.
 */
export class StubPlatformClient implements PlatformClient {
  readonly kind = 'stub' as const;

  private readonly byId = new Map<string, StubRecord>();
  private readonly byIdempotencyKey = new Map<string, string>();
  private readonly stirIndex = new Map<string, string>();

  async createOrganizationApplication(
    input: CreateApplicationInput,
  ): Promise<CreateApplicationResult> {
    const stir = input.stir.trim();

    const existingId = this.byIdempotencyKey.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.byId.get(existingId);
      if (existing) {
        // Replay: same key, same application. Never a second row.
        return {
          applicationId: existing.applicationId,
          status: existing.status,
          createdAt: existing.createdAt,
        };
      }
    }

    const fields: Record<string, string> = {};
    if (!input.organizationName.trim()) fields.organizationName = 'required';
    if (!isValidStir(stir)) fields.stir = 'must be 9-14 digits';
    if (!input.responsible.lastName.trim()) fields.lastName = 'required';
    if (!input.responsible.firstName.trim()) fields.firstName = 'required';
    if (!input.responsible.phone.trim()) fields.phone = 'required';
    if (input.documents.length === 0) fields.documents = 'at least one document required';

    if (Object.keys(fields).length > 0) {
      throw new PlatformError('validation_failed', 'Application validation failed', {
        httpStatus: 422,
        fields,
      });
    }

    const stirOwner = this.stirIndex.get(stir);
    if (stirOwner) {
      throw new PlatformError('stir_taken', `STIR ${stir} is already registered`, {
        httpStatus: 409,
      });
    }

    const now = new Date().toISOString();
    const record: StubRecord = {
      applicationId: randomUUID(),
      idempotencyKey: input.idempotencyKey,
      stir,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    };

    this.byId.set(record.applicationId, record);
    this.byIdempotencyKey.set(input.idempotencyKey, record.applicationId);
    this.stirIndex.set(stir, record.applicationId);

    logger.info(
      { applicationId: record.applicationId, organizationType: input.organizationType },
      'STUB platform: organization application created',
    );

    return {
      applicationId: record.applicationId,
      status: record.status,
      createdAt: record.createdAt,
    };
  }

  async getOrganizationApplicationStatus(
    applicationId: string,
  ): Promise<ApplicationStatusResult> {
    const record = this.byId.get(applicationId);
    if (!record) {
      throw new PlatformError('not_found', `Application ${applicationId} not found`, {
        httpStatus: 404,
      });
    }

    return {
      applicationId: record.applicationId,
      status: record.status,
      rejectionReason: record.rejectionReason,
      organizationId: record.organizationId,
      updatedAt: record.updatedAt,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // ---------------------------------------------------------------------------
  // Test / manual-QA helpers. Not part of PlatformClient — callers that depend on
  // these are, by construction, test or dev code only.
  // ---------------------------------------------------------------------------

  /** Move an application to a new stage, as the web panel would. */
  setStatus(
    applicationId: string,
    status: PlatformApplicationStatus,
    extra: { rejectionReason?: string; organizationId?: string } = {},
  ): void {
    const record = this.byId.get(applicationId);
    if (!record) {
      throw new PlatformError('not_found', `Application ${applicationId} not found`);
    }
    record.status = status;
    record.updatedAt = new Date().toISOString();
    if (extra.rejectionReason !== undefined) record.rejectionReason = extra.rejectionReason;
    if (extra.organizationId !== undefined) record.organizationId = extra.organizationId;
  }

  reset(): void {
    this.byId.clear();
    this.byIdempotencyKey.clear();
    this.stirIndex.clear();
  }
}
