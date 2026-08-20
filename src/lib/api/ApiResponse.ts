import { NextResponse } from 'next/server';
import { ApiError } from './ApiError';

export interface PaginationMeta {
  after?: string;
  limit: number;
  hasMore: boolean;
}

export class ApiResponse {
  /**
   * Returns a standardized success response according to IDD-08.
   */
  static success(data: any, pagination?: PaginationMeta, status: number = 200) {
    const response: any = {
      success: true,
      data
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return NextResponse.json(response, { status });
  }

  /**
   * Returns a standardized error response according to IDD-08.
   */
  static error(error: ApiError | Error, requestId?: string) {
    if (error instanceof ApiError) {
      return NextResponse.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId
        }
      }, { status: error.status });
    }

    // Unhandled exception
    console.error('Unhandled API Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId
      }
    }, { status: 500 });
  }
}
