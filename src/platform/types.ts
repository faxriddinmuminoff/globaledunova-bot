/**
 * Bot <-> Platform contract.
 *
 * Every field name and every status value below was read from the platform's own
 * source on 2026-07-30, not from its documentation — the documentation disagreed
 * with the code in eleven places. The authoritative sources were
 * `organizationApplicationStore.js`, `platformAdmin.js`, `owner.js`,
 * `ownerApproval.js` and `organizationVerification.js`.
 *
 * Scope (Faza 0): the bot may ONLY create an organization application and read
 * back the status of one it created. No tenant data, no exams, no credentials.
 */

/**
 * `ALLOWED_ORGANIZATION_TYPES` in the platform store. Verified identical to what
 * the bot already collected — this list needed no change.
 */
export const ORGANIZATION_TYPES = [
  'university',
  'institute',
  'college',
  'training-center',
  'corporate-academy',
  'other',
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export function isOrganizationType(value: string): value is OrganizationType {
  return (ORGANIZATION_TYPES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/**
 * The platform's `applicationStatus` vocabulary — all fourteen values, exactly as
 * `ALLOWED_APPLICATION_STATUSES` defines them.
 *
 * The platform actually tracks FIVE independent status axes (`applicationStatus`,
 * `verificationStatus`, `platformAdminReviewStatus`, `ownerReviewStatus`,
 * `activationStatus`). `applicationStatus` is the one that moves at every stage,
 * so it is what the bot stores; the others are read only when they add something
 * the applicant needs (a reason).
 */
export const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'system_verify_running',
  'system_verify_blocked',
  'system_verify_passed',
  'platform_admin_review',
  'platform_admin_rejected',
  'ready_for_owner',
  'owner_pending',
  'owner_approved',
  'owner_rejected',
  'return_for_correction',
  'activated',
  'archived',
] as const;

export type PlatformApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function isApplicationStatus(value: string): value is PlatformApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

/**
 * What the applicant is actually told.
 *
 * Fourteen raw stages collapse to ten, because several of them are internal
 * bookkeeping the applicant cannot act on: `draft` and `system_verify_running`
 * mean the same thing to them as `submitted`, and `system_verify_passed` means
 * the same as `platform_admin_review` — "someone is looking at it".
 */
export const BOT_STATUSES = [
  'submitted',
  'verify_failed',
  'in_review',
  'pa_rejected',
  'awaiting_owner',
  'owner_approved',
  'rejected',
  'needs_correction',
  'activated',
  'archived',
] as const;

export type BotStatus = (typeof BOT_STATUSES)[number];

const STATUS_MAP: Record<PlatformApplicationStatus, BotStatus> = {
  draft: 'submitted',
  submitted: 'submitted',
  system_verify_running: 'submitted',
  system_verify_blocked: 'verify_failed',
  system_verify_passed: 'in_review',
  platform_admin_review: 'in_review',
  platform_admin_rejected: 'pa_rejected',
  ready_for_owner: 'awaiting_owner',
  owner_pending: 'awaiting_owner',
  owner_approved: 'owner_approved',
  owner_rejected: 'rejected',
  return_for_correction: 'needs_correction',
  activated: 'activated',
  archived: 'archived',
};

export function toBotStatus(status: PlatformApplicationStatus): BotStatus {
  return STATUS_MAP[status];
}

/**
 * Stages the applicant must act on. These are the two the platform's own
 * correction flow accepts (`validateSubmitCorrection`): a blocked verification
 * and an explicit return for correction. Everything else is either in motion or
 * finished.
 */
const ACTIONABLE_STATUSES: readonly PlatformApplicationStatus[] = [
  'system_verify_blocked',
  'return_for_correction',
];

export function needsApplicantAction(status: PlatformApplicationStatus): boolean {
  return ACTIONABLE_STATUSES.includes(status);
}

/**
 * Stages after which nothing more will happen, so polling can stop.
 *
 * `platform_admin_rejected` and `owner_rejected` are terminal because the
 * platform has no resume path out of either — only `return_for_correction` and
 * `system_verify_blocked` are recoverable. A rejected application additionally
 * leaves its organization row `pending` forever, which permanently reserves the
 * STIR; the applicant cannot re-apply with the same one.
 */
const TERMINAL_STATUSES: readonly PlatformApplicationStatus[] = [
  'platform_admin_rejected',
  'owner_rejected',
  'activated',
  'archived',
];

export function isTerminalStatus(status: PlatformApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// ---------------------------------------------------------------------------
// Responsible person
// ---------------------------------------------------------------------------

/**
 * The platform stores ONE string, `responsiblePersonName`, plus a top-level
 * `phone`. It does not accept name parts.
 *
 * The bot still ASKS for the three parts separately and composes them here. That
 * is deliberate: the platform learned the hard way that splitting a single field
 * on whitespace stores the surname as the given name, and its own `personName.js`
 * treats a lone token as the surname. Collecting the parts and composing them
 * means the bot never has to split anything, and the day the platform accepts
 * parts, nothing upstream has to change.
 */
export interface ResponsiblePersonParts {
  lastName: string;
  firstName: string;
  middleName: string;
}

/** Compose in the platform's canonical order: Familiya Ism Otasining-ismi. */
export function composeFullName(person: Partial<ResponsiblePersonParts>): string {
  return [person.lastName, person.firstName, person.middleName]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

/**
 * `documentType` values. The platform does not constrain this field — its
 * `DOCUMENTS_PRESENT` rule only counts the array — so the vocabulary is the
 * bot's, kept small and stable.
 */
export const DOCUMENT_TYPES = ['charter', 'license', 'letter'] as const;

export type ApplicationDocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * The wire shape. The platform's document normalizer keeps exactly
 * `{documentType, storageRef, uploadedAt, sha256}` and SILENTLY DROPS every
 * other key, so sending more is not an error — it is an illusion. An entry
 * missing any of the first three is dropped whole.
 */
export interface ApplicationDocumentPayload {
  documentType: ApplicationDocumentType;
  storageRef: string;
  uploadedAt: string;
  /**
   * Accepted by the platform's normalizer but, at the time of reading, not yet
   * used by it. Sent anyway: without it nobody can later prove the bytes the
   * platform is shown are the bytes that were submitted.
   */
  sha256: string;
}

/**
 * What the BOT keeps about a stored charter. `fileName` and `sizeBytes` exist
 * only so the applicant can see what they attached — the platform never receives
 * them, because it would drop them.
 */
export interface StoredDocument extends ApplicationDocumentPayload {
  fileName: string;
  sizeBytes: number;
}

export function toDocumentPayload(document: StoredDocument): ApplicationDocumentPayload {
  return {
    documentType: document.documentType,
    storageRef: document.storageRef,
    uploadedAt: document.uploadedAt,
    sha256: document.sha256,
  };
}

// ---------------------------------------------------------------------------
// Requests and responses
// ---------------------------------------------------------------------------

export interface CreateApplicationInput {
  /**
   * Bot-generated, stable for one logical submission. The platform has NO
   * idempotency-key handling of its own — a replayed create either duplicates
   * the application or returns a 400 that cannot be told apart from a validation
   * failure. So this key protects the bot's own retry, and the integration route
   * must honour it.
   */
  idempotencyKey: string;
  organizationName: string;
  organizationType: OrganizationType;
  stir: string;
  /** Composed by the bot; the platform stores this single string. */
  responsiblePersonName: string;
  /** Top-level on the platform record, not nested under the person. */
  phone: string;
  contactTelegramId: number;
  documents: ApplicationDocumentPayload[];
}

export interface CreateApplicationResult {
  applicationId: string;
  status: PlatformApplicationStatus;
  createdAt: string;
}

export interface ApplicationStatusResult {
  applicationId: string;
  status: PlatformApplicationStatus;
  /**
   * Why a stage rejected or returned the application. The platform keeps this on
   * three different fields depending on which stage acted
   * (`platformAdminReviewReason`, `ownerReviewReason`, or a verification report),
   * and its own PA projection omits the first one entirely. The integration route
   * is expected to surface whichever one applies as this single field.
   */
  rejectionReason?: string;
  /** Set once the tenant is activated. */
  organizationId?: string;
  updatedAt: string;
}

export type PlatformErrorCode =
  /**
   * The STIR already belongs to a pending or active organization. Note this is a
   * VERIFICATION rule on the platform, not an intake check — a plain create will
   * succeed and fail later at verify. The integration route is expected to run
   * the duplicate check up front so the applicant learns immediately.
   */
  | 'stir_taken'
  | 'validation_failed'
  | 'unauthorized'
  | 'not_found'
  | 'unavailable'
  | 'timeout'
  | 'unknown';

export class PlatformError extends Error {
  readonly code: PlatformErrorCode;
  readonly httpStatus?: number;
  readonly fields?: Record<string, string>;

  constructor(
    code: PlatformErrorCode,
    message: string,
    options: { httpStatus?: number; fields?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = 'PlatformError';
    this.code = code;
    this.httpStatus = options.httpStatus;
    this.fields = options.fields;
  }

  /** True when retrying the same request later could succeed. */
  get isRetryable(): boolean {
    return this.code === 'unavailable' || this.code === 'timeout';
  }
}

/**
 * STIR rule, copied from the platform's verification module: strictly numeric,
 * 9 to 14 digits (`STIR_MIN_LENGTH` / `STIR_MAX_LENGTH` / `/^\d+$/`).
 *
 * The platform's intake does NOT apply this — its store only strips whitespace,
 * so a malformed STIR is accepted at create and fails at verify. The bot applies
 * it up front so the applicant fixes it while they are still typing.
 */
export function isValidStir(value: string): boolean {
  return /^\d{9,14}$/.test(value.replace(/\s+/g, ''));
}
