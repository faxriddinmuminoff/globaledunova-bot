import { PlatformApplicationStatus, isTerminalStatus } from '../platform/types';
import { OrgApplicationStatusPatch, OrgApplicationStore } from './orgapp-store.types';
import { OrgApplicationRecord } from './types';

/**
 * In-memory implementation. Used by tests, and the base class of the JSON store
 * so that persistence is the ONLY difference between them.
 */
export class MemoryOrgApplicationStore implements OrgApplicationStore {
  protected readonly records = new Map<string, OrgApplicationRecord>();

  async save(record: OrgApplicationRecord): Promise<OrgApplicationRecord> {
    this.records.set(record.applicationId, { ...record });
    await this.persist();
    return { ...record };
  }

  async findById(applicationId: string): Promise<OrgApplicationRecord | null> {
    const found = this.records.get(applicationId);
    return found ? { ...found } : null;
  }

  async listByTelegramId(telegramId: number): Promise<OrgApplicationRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.contactTelegramId === telegramId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map((record) => ({ ...record }));
  }

  async listOpen(): Promise<OrgApplicationRecord[]> {
    return [...this.records.values()]
      .filter((record) => !isTerminalStatus(record.status))
      .sort((a, b) => a.lastCheckedAt.localeCompare(b.lastCheckedAt))
      .map((record) => ({ ...record }));
  }

  async applyStatus(
    applicationId: string,
    patch: OrgApplicationStatusPatch,
  ): Promise<OrgApplicationRecord | null> {
    const record = this.records.get(applicationId);
    if (!record) return null;

    record.status = patch.status;
    record.lastCheckedAt = patch.lastCheckedAt;
    // Only overwrite when the platform actually said something: a later poll that
    // omits the reason must not erase the reason the applicant was already shown.
    if (patch.rejectionReason !== undefined) record.rejectionReason = patch.rejectionReason;
    if (patch.organizationId !== undefined) record.organizationId = patch.organizationId;

    await this.persist();
    return { ...record };
  }

  async markNotified(
    applicationId: string,
    status: PlatformApplicationStatus,
  ): Promise<boolean> {
    const record = this.records.get(applicationId);
    if (!record) return false;
    if (record.notifiedStatuses.includes(status)) return false;

    record.notifiedStatuses.push(status);
    await this.persist();
    return true;
  }

  async countAll(): Promise<number> {
    return this.records.size;
  }

  /** Overridden by the JSON store. A no-op here by design. */
  protected async persist(): Promise<void> {
    // memory only
  }

  reset(): void {
    this.records.clear();
  }
}
