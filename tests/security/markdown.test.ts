import { describe, it, expect } from 'vitest';
import { escapeMarkdown, safeMarkdown } from '../../src/security/markdown';

describe('markdown', () => {
  it('escapes special characters', () => {
    expect(escapeMarkdown('Hello *world*')).toBe('Hello \\*world\\*');
    expect(escapeMarkdown('test_file.pdf')).toBe('test\\_file\\.pdf');
  });

  it('safeMarkdown alias works', () => {
    expect(safeMarkdown('[link]')).toBe('\\[link\\]');
  });
});
