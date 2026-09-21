/**
 * Paginated Response Type - Enterprise Standard
 * 
 * Standard pagination type for all list endpoints
 */

export interface PaginatedMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}

// Helper to transform API response to paginated format
export function createPaginatedResponse<T>(
  data: T[],
  currentPage: number = 1,
  perPage: number = 10,
  total: number = data.length
): Paginated<T> {
  const lastPage = Math.ceil(total / perPage);
  
  return {
    data,
    meta: {
      currentPage,
      lastPage,
      perPage,
      total,
    },
  };
}
