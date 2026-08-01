import { randomUUID } from 'node:crypto';
import { logger } from '../logger';
import { PlatformClient } from './platform-client.interface';
import {
  ApplicationStatusResult,
  CreateApplicationInput,
  CreateApplicationResult,
  PlatformApplicationStatus,
  PlatformError,
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
 * It exists because the platform runs on the owner's machine while the bot runs
 * on a droplet — today they cannot talk. The whole applicant flow is built and
 * tested against this, then the HTTP client is switched on by setting
 * PLATFORM_URL.
 *
 * It models the CONTRACT the integration route must satisfy, which is not always
 * the same as what the platform's existing PA route does today. Two places where
 * that distinction matters, both taken from reading the platform's source:
 *
 *   1. STIR FORMAT is not checked at intake. The platform's store only strips
 *      whitespace; `STIR_FORMAT_VALID` is a rule of the LATER verification step.
 *      So a malformed STIR is accepted here too — the bot catches it in the
 *      wizard, before it ever gets this far.
 *   2. STIR UNIQUENESS *is* checked at intake, because creating an application
 *      also creates a `pending` organization row and that bind refuses a
 *      duplicate. The platform surfaces it as a generic 400; the integration
 *      route is asked to surface it as 409 `stir_taken` so a client can tell it
 *      apart from a validation failure.
 *
 * Documents are NOT required at intake — the platform's `DOCUMENTS_PRESENT` rule
 * also belongs to verification. The bot requires one anyway, in the wizard,
 * because an application that cannot pass verification is not worth submitting.
 *
 * State is per-process and NOT persisted, so it can never be mistaken for a real
 * backing store.
 */
export class StubPlatformClient implements PlatformClient {
  readonly kind = 'stub' as const;

  private readonly byId = new Map<string, StubRecord>();
  private readonly byIdempotencyKey = new Map<string, string>();
  private readonly stirIndex = new Map<string, string>();

  async createOrganizationApplication(
    input: CreateApplicationInput,
  ): Promise<CreateApplicationResult> {
    // The platform's normalizeStir strips whitespace and nothing else.
    const stir = input.stir.replace(/\s+/g, '');

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

    // The five fields the platform's validateApplicationInput requires, and it
    // checks non-emptiness only.
    const fields: Record<string, string> = {};
    if (!input.organizationName.trim()) fields.organizationName = 'required';
    if (!input.organizationType.trim()) fields.organizationType = 'required';
    if (!stir) fields.stir = 'required';
    if (!input.responsiblePersonName.trim()) fields.responsiblePersonName = 'required';
    if (!input.phone.trim()) fields.phone = 'required';

    if (Object.keys(fields).length > 0) {
      throw new PlatformError('validation_failed', 'Application validation failed', {
        httpStatus: 422,
        fields,
      });
    }

    if (this.stirIndex.has(stir)) {
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
  // Test / manual-QA helpers. Not part of PlatformClient, so anything depending
  // on them is by construction test or dev code.
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

  /**
   * Free the STIR, as an archive route would. The platform has no such route
   * today — a rejected application's organization stays `pending` forever and the
   * STIR stays reserved — so this exists to test what the bot does once one is
   * added, not to model current behaviour.
   */
  releaseStir(stir: string): void {
    this.stirIndex.delete(stir.replace(/\s+/g, ''));
  }

  reset(): void {
    this.byId.clear();
    this.byIdempotencyKey.clear();
    this.stirIndex.clear();
  }
}
