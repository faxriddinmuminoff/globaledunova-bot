/**
 * Bot <-> Platform contract types.
 *
 * This module is the SINGLE place where the shape of the platform integration is
 * encoded. Both the stub and the HTTP client implement the same interface against
 * these types, so a change here is a change on both sides at once.
 *
 * Scope (Faza 0): the bot may ONLY create an organization application and read
 * back the status of an application it created itself. It has no access to tenant
 * data, no access to exams, and it never carries a user credential.
 */

/** Organization types accepted by the platform's provisioning pipeline. */
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

/**
 * Pipeline status as the bot understands it.
 *
 * These mirror the platform's §1A.N stages (10C verify -> 10D PA review ->
 * 10E owner approval -> 10F activation). The bot NEVER advances a status itself;
 * it only reads. The owner approval step is non-delegable and lives in the web
 * panel only.
 */
export const APPLICATION_STATUSES = [
  'submitted',
  'verify_passed',
  'verify_failed',
  'pa_approved',
  'pa_rejected',
  'owner_approved',
  'owner_rejected',
  'activated',
] as const;

export type PlatformApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Statuses after which no further change is expected — polling can stop. */
const TERMINAL_STATUSES: readonly PlatformApplicationStatus[] = [
  'verify_failed',
  'pa_rejected',
  'owner_rejected',
  'activated',
];

export function isTerminalStatus(status: PlatformApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isApplicationStatus(value: string): value is PlatformApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

/**
 * Three-part name, sent as three fields — never as one string to be split.
 *
 * The platform learned this the hard way: splitting "Sobirov Aziz Rustamovich" on
 * the first space stored the surname as the given name. The platform's canonical
 * order is `Familiya Ism Otasining-ismi` (see `personName.js` / `composeFullName`).
 * We send the parts separately so no splitting is needed on either side.
 */
export interface ResponsiblePerson {
  lastName: string;
  firstName: string;
  middleName: string;
  phone: string;
}

/** Compose a display name in the platform's canonical order. Blanks are skipped. */
export function composeFullName(person: {
  lastName?: string;
  firstName?: string;
  middleName?: string;
}): string {
  return [person.lastName, person.firstName, person.middleName]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

export const DOCUMENT_KINDS = ['charter', 'license', 'letter'] as const;

export type ApplicationDocumentKind = (typeof DOCUMENT_KINDS)[number];

/** A document the bot has already received, stored and hashed. */
export interface ApplicationDocumentRef {
  kind: ApplicationDocumentKind;
  fileName: string;
  /** Opaque reference the platform stores verbatim, e.g. `local://org-apps/2026/ab12.pdf`. */
  storageRef: string;
  sizeBytes: number;
  /** Lowercase hex sha256 of the stored bytes. Lets the platform detect corruption. */
  sha256: string;
}

export interface CreateApplicationInput {
  /**
   * Bot-generated key, stable for one logical submission. Replaying the same key
   * must return the SAME application, never create a second one — a Telegram
   * network retry must not produce two applications for one institution.
   */
  idempotencyKey: string;
  organizationName: string;
  organizationType: OrganizationType;
  stir: string;
  responsible: ResponsiblePerson;
  contactTelegramId: number;
  documents: ApplicationDocumentRef[];
}

export interface CreateApplicationResult {
  applicationId: string;
  status: PlatformApplicationStatus;
  createdAt: string;
}

export interface ApplicationStatusResult {
  applicationId: string;
  status: PlatformApplicationStatus;
  /** Set when a stage rejected the application. Shown to the applicant verbatim. */
  rejectionReason?: string;
  /** Set once the tenant is activated (10F). */
  organizationId?: string;
  updatedAt: string;
}

export type PlatformErrorCode =
  /** The STIR already belongs to an organization. The platform has no archive route yet. */
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
 * STIR rule, copied deliberately from the platform's own validator so the bot
 * rejects a bad value before spending a round trip: strict numeric, 9-14 digits.
 */
export function isValidStir(value: string): boolean {
  return /^\d{9,14}$/.test(value.trim());
}
