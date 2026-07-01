import { describe, it, expect } from 'vitest';
import { normalizePagination, buildPaginatedResult } from '../../src/types/pagination';

describe('pagination', () => {
  it('normalizes page and pageSize', () => {
    expect(normalizePagination({ page: 0, pageSize: 500 })).toEqual({
      page: 1,
      pageSize: 50,
      offset: 0,
    });
    expect(normalizePagination({ page: 3, pageSize: 10 })).toEqual({
      page: 3,
      pageSize: 10,
      offset: 20,
    });
  });

  it('builds paginated result', () => {
    const result = buildPaginatedResult([1, 2, 3], 25, 2, 10);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(25);
    expect(result.items).toEqual([1, 2, 3]);
  });
});
