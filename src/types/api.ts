// ═══════════════════════════════════════════════════════════════════════════════
// iSCARB — Global API Types
// Standardized response envelope, pagination, and error types.
// ═══════════════════════════════════════════════════════════════════════════════

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ApiResponseMeta;
  error?: ApiError;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
}
