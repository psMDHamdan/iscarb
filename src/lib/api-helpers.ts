// Re-export from new location — update imports to @/utils/api-response
export {
  hmacSign, hmacVerify, generateApiKey, hashApiKey,
  DEFAULT_RATE_LIMIT, checkRateLimit, negotiateVersion,
} from "@/utils/api-response";
export type { RateLimitConfig, RateCheckResult, ApiVersion } from "@/utils/api-response";

export async function parseJSON<T>(req: Request): Promise<T | null> {
  try {
    return await req.json() as T;
  } catch {
    return null;
  }
}

export function jsonErrorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
