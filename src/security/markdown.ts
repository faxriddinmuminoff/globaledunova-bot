const MARKDOWN_ESCAPE_PATTERN = /([_*[\]()~`>#+\-=|{}.!\\])/g;

export function escapeMarkdown(text: string): string {
  return text.replace(MARKDOWN_ESCAPE_PATTERN, '\\$1');
}

export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export function safeMarkdown(text: string): string {
  return escapeMarkdown(text);
}

/**
 * Escape for Telegram's LEGACY `parse_mode: 'Markdown'`.
 *
 * Legacy Markdown treats only `_`, `*`, `` ` `` and `[` as special. Passing it a
 * string escaped for MarkdownV2 (as `escapeMarkdown` above does) makes Telegram
 * render the backslashes literally — an institution named "Toshkent (filial)"
 * would come out as "Toshkent \(filial\)". Use this for user-supplied values
 * interpolated into a legacy-Markdown message.
 */
export function escapeLegacyMarkdown(text: string): string {
  return text.replace(/([_*`[])/g, '\\$1');
}
