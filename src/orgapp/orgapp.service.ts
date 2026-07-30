import { logger } from '../logger';
import { getPlatformClient } from '../platform/platform.factory';
import {
  PlatformApplicationStatus,
  PlatformError,
  composeFullName,
  isTerminalStatus,
} from '../platform/types';
import { getOrgApplicationStore } from './orgapp-store.factory';
import { OrgApplicationRecord, WizardDraft } from './types';
import { isSubmittable } from './wizard';

export type SubmitFailureReason =
  | 'incomplete'
  | 'stir_taken'
  | 'validation'
  | 'unavailable'
  | 'unknown';

export type SubmitOutcome =
  | { ok: true; record: OrgApplicationRecord }
  | { ok: false; reason: SubmitFailureReason };

export interface SubmitApplicationInput {
  telegramId: number;
  idempotencyKey: string;
  draft: WizardDraft;
}

/**
 * Send a completed draft to the platform and remember the result.
 *
 * Order matters: the platform is called FIRST and only a platform-issued id is
 * stored. The bot never invents an application id, so there can be no local row
 * that the platform has never heard of.
 */
export async function submitApplication(
  input: SubmitApplicationInput,
): Promise<SubmitOutcome> {
  const { draft } = input;

  if (!isSubmittable(draft)) {
    return { ok: false, reason: 'incomplete' };
  }

  const responsible = {
    lastName: draft.lastName ?? '',
    firstName: draft.firstName ?? '',
    middleName: draft.middleName ?? '',
    phone: draft.phone ?? '',
  };

  try {
    const created = await getPlatformClient().createOrganizationApplication({
      idempotencyKey: input.idempotencyKey,
      organizationName: draft.organizationName!,
      organizationType: draft.organizationType!,
      stir: draft.stir!,
      responsible,
      contactTelegramId: input.telegramId,
      documents: [draft.charter!],
    });

    const record: OrgApplicationRecord = {
      applicationId: created.applicationId,
      contactTelegramId: input.telegramId,
      organizationName: draft.organizationName!,
      organizationType: draft.organizationType!,
      stir: draft.stir!,
      responsibleFullName: composeFullName(responsible),
      status: created.status,
      submittedAt: created.createdAt,
      lastCheckedAt: created.createdAt,
      // The applicant has just been told it was submitted, so that status is
      // already announced and must not be re-sent by the first poll.
      notifiedStatuses: [created.status],
    };

    const saved = await getOrgApplicationStore().save(record);

    logger.info(
      { applicationId: saved.applicationId, telegramId: input.telegramId },
      'Organization application submitted',
    );

    return { ok: true, record: saved };
  } catch (error) {
    if (error instanceof PlatformError) {
      logger.warn(
        { code: error.code, httpStatus: error.httpStatus, fields: error.fields },
        'Platform rejected an organization application',
      );

      switch (error.code) {
        case 'stir_taken':
          return { ok: false, reason: 'stir_taken' };
        case 'validation_failed':
          return { ok: false, reason: 'validation' };
        case 'unavailable':
        case 'timeout':
        case 'unauthorized':
          // unauthorized is grouped here on purpose: it is an operator problem, and
          // telling the applicant "try again later" is both true and actionable.
          return { ok: false, reason: 'unavailable' };
        default:
          return { ok: false, reason: 'unknown' };
      }
    }

    logger.error({ error }, 'Unexpected failure submitting an organization application');
    return { ok: false, reason: 'unknown' };
  }
}

export interface StatusTransition {
  record: OrgApplicationRecord;
  previousStatus: PlatformApplicationStatus;
  /** True only when the status actually moved AND has not been announced before. */
  shouldNotify: boolean;
}

/**
 * Re-read one application from the platform.
 *
 * Returns null when the application is unknown locally, or when the platform could
 * not be reached — an unreachable platform must NOT look like "no change", so the
 * caller distinguishes null (nothing learned) from a transition with
 * shouldNotify === false (learned, nothing new to say).
 */
export async function refreshApplication(
  applicationId: string,
): Promise<StatusTransition | null> {
  const store = getOrgApplicationStore();
  const existing = await store.findById(applicationId);
  if (!existing) return null;

  let status;
  try {
    status = await getPlatformClient().getOrganizationApplicationStatus(applicationId);
  } catch (error) {
    if (error instanceof PlatformError && error.code === 'not_found') {
      // Do not delete the row: an application that vanished from the platform is an
      // incident worth investigating, not something to quietly clean up.
      logger.error({ applicationId }, 'Platform no longer knows this application');
    } else {
      logger.warn({ error, applicationId }, 'Could not refresh application status');
    }
    return null;
  }

  const updated = await store.applyStatus(applicationId, {
    status: status.status,
    rejectionReason: status.rejectionReason,
    organizationId: status.organizationId,
    lastCheckedAt: new Date().toISOString(),
  });

  if (!updated) return null;

  const moved = existing.status !== status.status;
  const shouldNotify = moved
    ? await store.markNotified(applicationId, status.status)
    : false;

  return { record: updated, previousStatus: existing.status, shouldNotify };
}

/** Every open application, oldest-checked first, so polling is fair. */
export async function listOpenApplications(): Promise<OrgApplicationRecord[]> {
  return getOrgApplicationStore().listOpen();
}

export async function listApplicationsFor(
  telegramId: number,
): Promise<OrgApplicationRecord[]> {
  return getOrgApplicationStore().listByTelegramId(telegramId);
}

export function isApplicationClosed(record: OrgApplicationRecord): boolean {
  return isTerminalStatus(record.status);
}
