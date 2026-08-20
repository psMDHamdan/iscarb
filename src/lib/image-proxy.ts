/**
 * Route external image URLs through the server-side image proxy so they are
 * served from `self` and never violate the site Content-Security-Policy.
 * Data URIs and relative paths are returned unchanged.
 */
export function proxiedImageUrl(url: string | null | undefined): string {
  if (!url) return url ?? "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/iscarb/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}