import { DocumentType } from '../documents/types';

export interface UniversityRequirement {
  id: number;
  university_id: string;
  document_type: DocumentType;
  is_required: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
