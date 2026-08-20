import { NextRequest, NextResponse } from 'next/server';
import { runWithTenant } from './tenantContext';
import { getSession, AuthError } from './auth';
import { Prisma } from '@prisma/client';

type RouteHandler = (req: NextRequest, context: any) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a Next.js App Router route handler to automatically extract the 
 * organizationId from the user's session and initialize the tenant context.
 * This guarantees that all Prisma queries within this handler are scoped to the tenant.
 */
export function withTenantContext(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: any) => {
    try {
      const session = await getSession(req);
      if (!session || !session.organizationId) {
        return NextResponse.json({ error: 'Unauthorized or missing organization context' }, { status: 401 });
      }

      // Run the handler within the AsyncLocalStorage context
      return await runWithTenant(session.organizationId, () => handler(req, context));
    } catch (error: any) {
      // Auth errors
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      // Prisma specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
          case 'P2002':
            return NextResponse.json({ error: 'Duplicate record' }, { status: 409 });
          case 'P2003':
            return NextResponse.json({ error: 'Foreign key constraint failed' }, { status: 400 });
          default:
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
      }
      if (error instanceof Prisma.PrismaClientInitializationError) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
      }

      // Known application errors with status codes
      if ('statusCode' in error && typeof error.statusCode === 'number') {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      console.error('Unhandled API error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
