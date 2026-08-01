import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { logger } from '../logger';
import { StoredDocument } from '../platform/types';
import { MAX_CHARTER_SIZE_BYTES, StepResult } from './types';
import { validateCharterFile } from './wizard';

/** Sub-directory under LOCAL_STORAGE_DIR where charters land. */
export const CHARTER_SUBDIR = 'org-apps';

export interface CharterSource {
  telegramFileId: string;
  fileName: string;
  mimeType: string;
  /** Size as Telegram reports it. May be 0/absent, so it is re-checked after download. */
  sizeBytes: number;
}

/**
 * Injected so the whole path can be tested without Telegram and without touching
 * the network. Production wiring passes Telegraf's getFileLink and global fetch.
 */
export interface CharterDeps {
  getFileLink: (telegramFileId: string) => Promise<string>;
  fetchBytes: (url: string) => Promise<Buffer>;
  baseDir?: string;
}

export type StoreCharterResult = StepResult<StoredDocument>;

export const defaultFetchBytes = async (url: string): Promise<Buffer> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

/**
 * Download a charter from Telegram, store it on local disk and return the
 * reference the platform will hold.
 *
 * The file is stored under a name derived from its own sha256, so the same
 * document uploaded twice occupies one file and the reference is content-addressed
 * — the platform can verify later that the bytes it is shown are the bytes that
 * were submitted.
 */
export async function storeCharter(
  source: CharterSource,
  deps: CharterDeps,
): Promise<StoreCharterResult> {
  const declared = validateCharterFile({
    fileName: source.fileName,
    // A missing size must not fail the "empty file" check before we have the bytes.
    sizeBytes: source.sizeBytes > 0 ? source.sizeBytes : 1,
  });
  if (!declared.ok) return { ok: false, error: declared.error };

  let buffer: Buffer;
  try {
    const link = await deps.getFileLink(source.telegramFileId);
    buffer = await deps.fetchBytes(link);
  } catch (error) {
    logger.error(
      { error, telegramFileId: source.telegramFileId },
      'Failed to download charter from Telegram',
    );
    // Treated as "send it again" rather than a validation verdict about the file.
    return { ok: false, error: 'required' };
  }

  if (buffer.length === 0) return { ok: false, error: 'required' };
  // Telegram's reported size can be absent or wrong; the bytes are the authority.
  if (buffer.length > MAX_CHARTER_SIZE_BYTES) return { ok: false, error: 'file_too_large' };

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const extension = path.extname(source.fileName).toLowerCase() || '.bin';
  const key = `${sha256.slice(0, 32)}${extension}`;

  const baseDir = deps.baseDir ?? path.join(config.LOCAL_STORAGE_DIR, CHARTER_SUBDIR);
  await fs.mkdir(baseDir, { recursive: true });

  const fullPath = path.join(baseDir, key);
  const tempPath = path.join(baseDir, `.${key}.tmp`);
  await fs.writeFile(tempPath, buffer);
  await fs.rename(tempPath, fullPath);

  logger.info(
    { key, sizeBytes: buffer.length, fileName: source.fileName },
    'Charter stored',
  );

  return {
    ok: true,
    value: {
      documentType: 'charter',
      uploadedAt: new Date().toISOString(),
      fileName: source.fileName,
      storageRef: `local://${CHARTER_SUBDIR}/${key}`,
      sizeBytes: buffer.length,
      sha256,
    },
  };
}
