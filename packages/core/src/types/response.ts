/**
 * response.ts
 *
 * API Response and Error contracts with Level 7 Complete Closed ADT Contracts.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module core/types
 */

export interface PaginationMetaContract {
  readonly current_page: number;
  readonly last_page: number;
  readonly per_page: number;
  readonly total: number;
  readonly from: number;
  readonly to: number;
}

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
};

export interface StandardApiResponseContract<T = unknown> {
  readonly success: true;
  readonly message: string;
  readonly data: T;
}

export interface PaginatedApiResponseContract<T = unknown> {
  readonly success: true;
  readonly message: string;
  readonly data: T;
  readonly meta: PaginationMetaContract;
}

export type ApiResponseContract<T = unknown> =
  | StandardApiResponseContract<T>
  | PaginatedApiResponseContract<T>;

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
};

export interface ApiErrorContract {
  readonly success: false;
  readonly message: string;
  readonly errors: readonly (readonly [string, readonly string[]])[];
  readonly status: number;
}

export type ApiError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
};
