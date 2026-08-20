export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ErrorDetail {
  field: string;
  message: string;
  value?: any;
}

export class ApiError extends Error {
  public code: ErrorCode;
  public status: number;
  public details?: ErrorDetail[];

  constructor(code: ErrorCode, message: string, status: number, details?: ErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static BadRequest(message: string, details?: ErrorDetail[]) {
    return new ApiError('VALIDATION_ERROR', message, 400, details);
  }

  static Unauthorized(message: string = 'Authentication required') {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  static Forbidden(message: string = 'Insufficient permissions') {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static NotFound(message: string = 'Resource not found') {
    return new ApiError('NOT_FOUND', message, 404);
  }

  static Conflict(message: string = 'Resource already exists') {
    return new ApiError('CONFLICT', message, 409);
  }

  static RateLimited(message: string = 'Rate limit exceeded') {
    return new ApiError('RATE_LIMITED', message, 429);
  }

  static Internal(message: string = 'Internal server error') {
    return new ApiError('INTERNAL_ERROR', message, 500);
  }
}
