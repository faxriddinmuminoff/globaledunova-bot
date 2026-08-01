import {
  BotStatus,
  StoredDocument,
  OrganizationType,
  PlatformApplicationStatus,
} from '../platform/types';

/**
 * The institution-application wizard.
 *
 * One institution representative fills one application, step by step. The steps
 * are ordered and every one is single-valued, so the whole flow is a small state
 * machine that can be reasoned about — and tested — without Telegram in the loop.
 */
export const WIZARD_STEPS = [
  'org_type',
  'org_name',
  'stir',
  'resp_last_name',
  'resp_first_name',
  'resp_middle_name',
  'resp_phone',
  'charter',
  'confirm',
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

/** Steps whose answer arrives as free text. Used to decide how to route input. */
export const TEXT_STEPS: readonly WizardStep[] = [
  'org_name',
  'stir',
  'resp_last_name',
  'resp_first_name',
  'resp_middle_name',
  'resp_phone',
];

export interface WizardDraft {
  organizationType?: OrganizationType;
  organizationName?: string;
  stir?: string;
  lastName?: string;
  firstName?: string;
  /** Empty string is a legitimate value here — not every person has a sharif. */
  middleName?: string;
  phone?: string;
  charter?: StoredDocument;
}

export interface WizardState {
  step: WizardStep;
  draft: WizardDraft;
  /**
   * Generated once, when the wizard is created, and reused for every submit
   * attempt of THIS draft. That is what makes a retry after a network error safe:
   * the platform sees the same key and returns the same application.
   */
  idempotencyKey: string;
  startedAt: number;
}

/** Validation outcomes the wizard can produce. Rendered per language by i18n. */
export type WizardFieldError =
  | 'required'
  | 'too_long'
  | 'stir_format'
  | 'phone_format'
  | 'file_type'
  | 'file_too_large';

export interface StepResult<T> {
  ok: boolean;
  value?: T;
  error?: WizardFieldError;
}

/** A submitted application, as the BOT remembers it. The platform stays authoritative. */
export interface OrgApplicationRecord {
  /** Platform-issued id. The bot never invents one. */
  applicationId: string;
  contactTelegramId: number;
  organizationName: string;
  organizationType: OrganizationType;
  stir: string;
  responsibleFullName: string;
  /** Last status the bot has seen. A mirror, not a source of truth. */
  status: PlatformApplicationStatus;
  rejectionReason?: string;
  organizationId?: string;
  submittedAt: string;
  /** When the bot last successfully read the status from the platform. */
  lastCheckedAt: string;
  /**
   * Which APPLICANT-VISIBLE stages have already been announced.
   *
   * Deliberately the reduced BotStatus, not the raw platform status: three raw
   * stages collapse to "submitted" and two to "in_review", so deduping on the raw
   * value would message the applicant twice for one visible change.
   */
  notifiedStatuses: BotStatus[];
}

export const MAX_ORGANIZATION_NAME_LENGTH = 200;
export const MAX_NAME_PART_LENGTH = 60;

/**
 * 20 MB is the Telegram Bot API download ceiling — a larger file cannot be
 * fetched by the bot at all, so refusing it early is honest rather than arbitrary.
 */
export const MAX_CHARTER_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_CHARTER_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'] as const;
