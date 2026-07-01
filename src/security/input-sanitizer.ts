const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeTextInput(input: string, maxLength = 512): string {
  return input.replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
}

export function sanitizePhone(input: string): string {
  return input.replace(/[^\d+]/g, '').slice(0, 20);
}

export function sanitizeSearchQuery(input: string): string {
  return sanitizeTextInput(input, 256);
}

export function isSafeFileName(fileName: string): boolean {
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return false;
  }
  return fileName.length > 0 && fileName.length <= 255;
}
