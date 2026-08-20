/**
 * Public Routes Configuration
 * ===========================================================================
 * Routes that bypass the withAuth middleware for unauthenticated access.
 * ===========================================================================
 */

export const PUBLIC_ROUTES: string[] = [
  // Health check endpoint
  "/api/health",

  // Authentication routes
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/logout",
  "/api/v1/auth/password/*",
  "/api/v1/auth/mfa/*",
  "/api/v1/auth/oidc/*",
  "/api/v1/auth/saml/metadata",

  // Public endpoints with their own validation
  "/api/sparql",
  "/api/graphql",
];
