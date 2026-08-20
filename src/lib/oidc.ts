/**
 * iSCARB OIDC Library
 * ===========================================================================
 * OpenID Connect authentication flow for LTI 1.3 and university IdPs.
 * Handles authorization code exchange, token validation, PKCE.
 * ===========================================================================
 */
import { logger } from "@/lib/logger";

export interface OIDCConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  redirectUri: string;
  scopes: string[];
}

export interface OIDCTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface OIDCUserInfo {
  sub: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  universityId?: string;
  role?: string;
}

/**
 * Generate PKCE code verifier and challenge.
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = base64UrlEncode(array);

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  return crypto.subtle.digest("SHA-256", data).then((digest) => ({
    codeVerifier,
    codeChallenge: base64UrlEncode(new Uint8Array(digest)),
  })) as any;
}

function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Build OIDC authorization URL.
 */
export function buildAuthorizationUrl(config: OIDCConfig, state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${config.issuer}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  config: OIDCConfig,
  code: string,
  codeVerifier: string
): Promise<OIDCTokens> {
  const tokenEndpoint = `${config.issuer}/token`;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error({ status: response.status, error }, "OIDC token exchange failed");
    throw new Error(`OIDC token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

/**
 * Validate ID token and extract user info.
 */
export async function validateIDToken(
  idToken: string,
  config: OIDCConfig
): Promise<OIDCUserInfo> {
  // In production, validate JWT signature against issuer's JWKS
  // For now, decode the payload
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

  // Basic validation
  if (payload.iss !== config.issuer) {
    throw new Error("Invalid issuer");
  }
  if (payload.aud !== config.clientId) {
    throw new Error("Invalid audience");
  }
  if (payload.exp < Date.now() / 1000) {
    throw new Error("Token expired");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.preferred_username,
    givenName: payload.given_name,
    familyName: payload.family_name,
    universityId: payload.org_id || payload.university_id,
    role: payload.role,
  };
}
