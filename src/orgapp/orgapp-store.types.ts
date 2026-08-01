import { BotStatus, PlatformApplicationStatus } from '../platform/types';
import { OrgApplicationRecord } from './types';

export interface OrgApplicationStatusPatch {
  status: PlatformApplicationStatus;
  rejectionReason?: string;
  organizationId?: string;
  lastCheckedAt: string;
}

/**
 * The bot's own record of applications it has submitted.
 *
 * This is deliberately thin. The platform is the source of truth for everything
 * about an application; the bot keeps just enough to (a) show an applicant what
 * they submitted, (b) know which applications still need polling, and (c) not
 * announce the same status twice.
 */
export interface OrgApplicationStore {
  save(record: OrgApplicationRecord): Promise<OrgApplicationRecord>;

  findById(applicationId: string): Promise<OrgApplicationRecord | null>;

  listByTelegramId(telegramId: number): Promise<OrgApplicationRecord[]>;

  /** Applications that have not reached a terminal stage yet. */
  listOpen(): Promise<OrgApplicationRecord[]>;

  applyStatus(
    applicationId: string,
    patch: OrgApplicationStatusPatch,
  ): Promise<OrgApplicationRecord | null>;

  /**
   * Record that a status has been announced. Returns true when this call was the
   * one that marked it — so the caller can send exactly once even if two workers
   * race.
   */
  markNotified(applicationId: string, status: BotStatus): Promise<boolean>;

  countAll(): Promise<number>;
}
