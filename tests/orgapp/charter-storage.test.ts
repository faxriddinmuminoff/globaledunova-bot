import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { storeCharter } from '../../src/orgapp/charter-storage';
import { MAX_CHARTER_SIZE_BYTES } from '../../src/orgapp/types';

let baseDir: string;

const source = {
  telegramFileId: 'file-123',
  fileName: 'ustav.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 2048,
};

beforeEach(async () => {
  baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'charter-'));
});

afterEach(async () => {
  await fs.rm(baseDir, { recursive: true, force: true });
});

function deps(bytes: Buffer, overrides: Partial<Parameters<typeof storeCharter>[1]> = {}) {
  return {
    getFileLink: vi.fn().mockResolvedValue('https://api.telegram.test/file/ustav.pdf'),
    fetchBytes: vi.fn().mockResolvedValue(bytes),
    baseDir,
    ...overrides,
  };
}

describe('storeCharter', () => {
  it('stores the bytes and returns a content-addressed reference', async () => {
    const bytes = Buffer.from('%PDF-1.7 charter body');
    const result = await storeCharter(source, deps(bytes));

    expect(result.ok).toBe(true);
    if (!result.ok || !result.value) return;

    const expectedSha = crypto.createHash('sha256').update(bytes).digest('hex');
    expect(result.value.sha256).toBe(expectedSha);
    expect(result.value.sizeBytes).toBe(bytes.length);
    expect(result.value.documentType).toBe('charter');
    expect(Date.parse(result.value.uploadedAt)).not.toBeNaN();
    expect(result.value.fileName).toBe('ustav.pdf');
    expect(result.value.storageRef).toBe(`local://org-apps/${expectedSha.slice(0, 32)}.pdf`);

    const written = await fs.readFile(path.join(baseDir, `${expectedSha.slice(0, 32)}.pdf`));
    expect(written.equals(bytes)).toBe(true);
  });

  it('leaves no temp file behind', async () => {
    await storeCharter(source, deps(Buffer.from('abc')));
    const entries = await fs.readdir(baseDir);
    expect(entries.filter((name) => name.includes('.tmp'))).toEqual([]);
  });

  it('stores the same document once when uploaded twice', async () => {
    const bytes = Buffer.from('identical charter');
    const first = await storeCharter(source, deps(bytes));
    const second = await storeCharter({ ...source, telegramFileId: 'other' }, deps(bytes));

    expect(first.ok && second.ok).toBe(true);
    expect(first.value?.storageRef).toBe(second.value?.storageRef);
    expect(await fs.readdir(baseDir)).toHaveLength(1);
  });

  it('rejects a disallowed extension before downloading anything', async () => {
    const d = deps(Buffer.from('x'));
    const result = await storeCharter({ ...source, fileName: 'ustav.docx' }, d);

    expect(result).toEqual({ ok: false, error: 'file_type' });
    expect(d.getFileLink).not.toHaveBeenCalled();
    expect(d.fetchBytes).not.toHaveBeenCalled();
  });

  it('rejects a file Telegram already reports as too large, without downloading', async () => {
    const d = deps(Buffer.from('x'));
    const result = await storeCharter(
      { ...source, sizeBytes: MAX_CHARTER_SIZE_BYTES + 1 },
      d,
    );

    expect(result).toEqual({ ok: false, error: 'file_too_large' });
    expect(d.fetchBytes).not.toHaveBeenCalled();
  });

  it('still proceeds when Telegram reports no size at all', async () => {
    const result = await storeCharter({ ...source, sizeBytes: 0 }, deps(Buffer.from('body')));
    expect(result.ok).toBe(true);
  });

  it('trusts the downloaded bytes over a wrong reported size', async () => {
    const tooBig = Buffer.alloc(MAX_CHARTER_SIZE_BYTES + 1, 1);
    const result = await storeCharter({ ...source, sizeBytes: 10 }, deps(tooBig));

    expect(result).toEqual({ ok: false, error: 'file_too_large' });
    expect(await fs.readdir(baseDir)).toEqual([]);
  });

  it('rejects an empty download', async () => {
    const result = await storeCharter(source, deps(Buffer.alloc(0)));
    expect(result).toEqual({ ok: false, error: 'required' });
  });

  it('asks for the file again when the download fails', async () => {
    const result = await storeCharter(
      source,
      deps(Buffer.from('x'), {
        fetchBytes: vi.fn().mockRejectedValue(new Error('network down')),
      }),
    );

    expect(result).toEqual({ ok: false, error: 'required' });
    expect(await fs.readdir(baseDir)).toEqual([]);
  });

  it('asks for the file again when Telegram will not give a link', async () => {
    const result = await storeCharter(
      source,
      deps(Buffer.from('x'), {
        getFileLink: vi.fn().mockRejectedValue(new Error('file is too big')),
      }),
    );

    expect(result).toEqual({ ok: false, error: 'required' });
  });

  it('creates the target directory if it does not exist', async () => {
    const nested = path.join(baseDir, 'a', 'b');
    const result = await storeCharter(source, deps(Buffer.from('x'), { baseDir: nested }));

    expect(result.ok).toBe(true);
    expect(await fs.readdir(nested)).toHaveLength(1);
  });

  it('keeps the extension of an image sent as a document', async () => {
    const result = await storeCharter({ ...source, fileName: 'SCAN.PNG' }, deps(Buffer.from('x')));
    expect(result.ok).toBe(true);
    expect(result.value?.storageRef.endsWith('.png')).toBe(true);
  });
});
