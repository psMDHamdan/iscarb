import { NextResponse, type NextRequest } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";

const log = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") return;
  console.error("[image-proxy]", ...args);
};

const MAX_BYTES = 15 * 1024 * 1024; // 15MB — generous for hi-res diagrams
const MAX_REDIRECTS = 3;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
  "image/x-icon",
]);

function isPrivateAddress(host: string): boolean {
  if (net.isIP(host) === 0) return false; // not an IP literal
  const parts = host.split(".").map(Number);
  if (parts.length === 4) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
    if (a >= 224) return true; // multicast + reserved
  }
  return false;
}

function isLoopbackOrLocal(host: string): boolean {
  return (
    host === "localhost" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  );
}

async function fetchImage(url: URL, redirectsLeft: number): Promise<Response> {
  const hostname = url.hostname;
  if (isLoopbackOrLocal(hostname)) throw new Error("blocked: localhost");
  if (isPrivateAddress(hostname)) throw new Error("blocked: private address");

  if (net.isIP(hostname) === 0) {
    const records = await dns.lookup(hostname, { all: true });
    for (const rec of records) {
      if (isPrivateAddress(rec.address)) throw new Error("blocked: resolves to private address");
    }
  }

  const res = await fetch(url, {
    redirect: "follow",
    cache: "force-cache",
    headers: {
      "User-Agent": "iSCARB-ImageProxy/1.0",
      Accept: "image/*",
    },
  });

  if (res.redirected && redirectsLeft > 0) {
    return fetchImage(new URL(res.url), redirectsLeft - 1);
  }

  return res;
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new NextResponse("Only http(s) URLs are supported", { status: 400 });
  }

  try {
    const res = await fetchImage(target, MAX_REDIRECTS);

    if (!res.ok) {
      log(`upstream ${res.status} for ${target.hostname}`);
      return new NextResponse(`Upstream image request failed (${res.status})`, {
        status: 502,
      });
    }

    const contentType = res.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      log(`blocked non-image content-type "${contentType}" from ${target.hostname}`);
      return new NextResponse("Upstream resource is not an image", { status: 415 });
    }

    const length = Number(res.headers.get("content-length") ?? "0");
    if (length > MAX_BYTES) {
      return new NextResponse("Image exceeds size limit", { status: 413 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return new NextResponse("Image exceeds size limit", { status: 413 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    log("failed:", err);
    return new NextResponse(
      "Unable to proxy image: " + (err instanceof Error ? err.message : "unknown error"),
      { status: 502 }
    );
  }
}