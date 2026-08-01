import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../logger';
import { MemoryOrgApplicationStore } from './memory-orgapp.store';
import { OrgApplicationRecord } from './types';
import { APPLICATION_STATUSES, BOT_STATUSES } from '../platform/types';

/**
 * JSON-file persistence.
 *
 * Chosen over PostgreSQL on purpose: the bot needs to remember tens of rows, not
 * millions, and the droplet it runs on has 512 MB of RAM — a Postgres container
 * there is what the OOM killer has been eating. It also matches the platform's own
 * JSON-file storage discipline, so there is one mental model across both codebases.
 *
 * Writes are atomic: a temp file in the same directory is written, fsynced and
 * renamed over the target. A crash mid-write therefore leaves either the previous
 * complete file or the new complete file, never a truncated one.
 */
export class JsonOrgApplicationStore extends MemoryOrgApplicationStore {
  private loaded = false;
  private writing: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {
    super();
  }

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        throw new Error('expected a JSON array of application records');
      }

      let skipped = 0;
      for (const row of parsed) {
        const record = normalizeRecord(row);
        if (record) {
          this.records.set(record.applicationId, record);
        } else {
          skipped += 1;
        }
      }

      this.loaded = true;
      logger.info(
        { filePath: this.filePath, loaded: this.records.size, skipped },
        'Organization application store loaded',
      );
      if (skipped > 0) {
        // Loud, because a skipped row means an applicant's submission is invisible
        // to the bot even though the platform may still hold it.
        logger.error(
          { filePath: this.filePath, skipped },
          'Some application rows were unreadable and were skipped',
        );
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        this.loaded = true;
        logger.info({ filePath: this.filePath }, 'Organization application store is new');
        return;
      }
      // Do not start with a silently empty store on a corrupt file — a fresh empty
      // store would be overwritten on the first save and lose everything.
      throw error;
    }
  }

  protected async persist(): Promise<void> {
    // Serialise writes so two concurrent mutations cannot interleave renames.
    this.writing = this.writing.then(() => this.writeSnapshot()).catch((error) => {
      logger.error({ error, filePath: this.filePath }, 'Failed to persist applications');
      throw error;
    });
    return this.writing;
  }

  private async writeSnapshot(): Promise<void> {
    const directory = path.dirname(this.filePath);
    await fs.mkdir(directory, { recursive: true });

    const payload = JSON.stringify([...this.records.values()], null, 2);
    const tempPath = path.join(directory, `.${path.basename(this.filePath)}.tmp`);

    const handle = await fs.open(tempPath, 'w');
    try {
      await handle.writeFile(payload, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }

    await fs.rename(tempPath, this.filePath);
  }
}

/**
 * Accept a row only when every field the bot relies on is present and of the
 * right type. A half-written or hand-edited row is skipped rather than allowed to
 * crash a poll cycle later.
 */
function normalizeRecord(row: unknown): OrgApplicationRecord | null {
  if (!row || typeof row !== 'object') return null;
  const candidate = row as Record<string, unknown>;

  const applicationId = asString(candidate.applicationId);
  const status = asString(candidate.status);
  const contactTelegramId = candidate.contactTelegramId;

  if (!applicationId) return null;
  if (typeof contactTelegramId !== 'number' || !Number.isFinite(contactTelegramId)) return null;
  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) return null;

  const notified = Array.isArray(candidate.notifiedStatuses)
    ? candidate.notifiedStatuses.filter(
        (value): value is OrgApplicationRecord['notifiedStatuses'][number] =>
          typeof value === 'string' &&
          (BOT_STATUSES as readonly string[]).includes(value),
      )
    : [];

  return {
    applicationId,
    contactTelegramId,
    organizationName: asString(candidate.organizationName),
    organizationType: asString(candidate.organizationType) as OrgApplicationRecord['organizationType'],
    stir: asString(candidate.stir),
    responsibleFullName: asString(candidate.responsibleFullName),
    status: status as OrgApplicationRecord['status'],
    rejectionReason: asOptionalString(candidate.rejectionReason),
    organizationId: asOptionalString(candidate.organizationId),
    submittedAt: asString(candidate.submittedAt) || new Date(0).toISOString(),
    lastCheckedAt: asString(candidate.lastCheckedAt) || new Date(0).toISOString(),
    notifiedStatuses: notified,
  };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}
