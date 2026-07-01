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
