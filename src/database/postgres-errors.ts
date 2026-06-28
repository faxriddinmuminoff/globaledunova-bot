export class DuplicateApplicationError extends Error {
  constructor() {
    super('Duplicate application');
    this.name = 'DuplicateApplicationError';
  }
}

export class DuplicateDocumentError extends Error {
  constructor() {
    super('Duplicate document');
    this.name = 'DuplicateDocumentError';
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

export function isDuplicateApplicationError(error: unknown): boolean {
  return error instanceof DuplicateApplicationError;
}

export function isDuplicateDocumentError(error: unknown): boolean {
  return error instanceof DuplicateDocumentError;
}
