import { Prisma } from '@prisma/client';

/**
 * Typed application error that carries an HTTP status code and a machine-readable
 * error code string, allowing route handlers to translate service-layer exceptions
 * into consistent HTTP responses.
 *
 * Satisfies Requirement 6.3 — typed application errors for Prisma error codes.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Restore prototype chain (required when extending built-ins in TypeScript)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Maps a Prisma (or unknown) error to a typed `AppError`.
 *
 * Prisma code mappings:
 *   P2025 — record not found              → 404 NOT_FOUND
 *   P2002 — unique constraint violation   → 409 CONFLICT
 *   other known Prisma errors             → 500 DB_ERROR
 *   unknown / non-Prisma error            → 500 INTERNAL_ERROR
 */
export function mapPrismaError(e: unknown): AppError {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2025':
        return new AppError('Record not found', 404, 'NOT_FOUND');
      case 'P2002':
        return new AppError('Duplicate record', 409, 'CONFLICT');
      default:
        return new AppError('Database error', 500, 'DB_ERROR');
    }
  }
  return new AppError('Internal error', 500, 'INTERNAL_ERROR');
}
