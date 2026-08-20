/**
 * GATE-14: visual_uniqueness
 * ===========================
 * Ensures each slide uses a distinct, concept-specific visual.
 *
 * Enforces:
 *   1. Zero image URL reuse across slides.
 *   2. Rejection of generic stock photo patterns (Unsplash, Shutterstock, Getty, iStock, Clipart).
 *   3. Rejection of overly generic visual titles (< 10 characters).
 *   4. Multi-factor semantic visual specification deduplication (pairwise similarity < 0.85).
 */

import { GateResult, type GateFinding } from "../types";
import {
  VisualDeduplicationRegistry,
  MAX_VISUAL_SIMILARITY_THRESHOLD,
} from "../../visual/deduplication";
import type { VisualSpecification } from "../../visual/types";

export function gateVisualUniqueness(
  artifacts: {
    slideNo: number;
    contentJson: {
      visualSpec?: any;
      visualIntent?: string | any;
    };
  }[]
): GateResult {
  const findings: GateFinding[] = [];

  // 1. Track image URLs across slides
  const imageUrls = new Map<string, number[]>(); // url → slide numbers

  for (const art of artifacts) {
    const c = art.contentJson;
    const spec = c.visualSpec;
    const url = spec?.fetchedImageUrl || spec?.imageUrl || "";

    if (url && typeof url === "string" && url.startsWith("http")) {
      // Normalize URL (strip query params for comparison)
      const normalizedUrl = url.split("?")[0];
      const slides = imageUrls.get(normalizedUrl) ?? [];
      slides.push(art.slideNo);
      imageUrls.set(normalizedUrl, slides);
    }
  }

  // Check for repeated images
  imageUrls.forEach((slides, url) => {
    if (slides.length > 1) {
      const filename = url.split("/").pop()?.split("?")[0] ?? "unknown";
      for (const slideNo of slides) {
        findings.push({
          slideNo,
          message: `Image reused across ${slides.length} slides (${slides.join(", ")}): "${filename.slice(0, 60)}" — each slide should have a concept-specific visual`,
        });
      }
    }
  });

  // 2. Check for generic stock image patterns & generic titles
  const genericPatterns = [
    /unsplash\.com.*photo-\d+/i,
    /shutterstock/i,
    /getty/i,
    /istockphoto/i,
    /stock\.adobe/i,
    /clipart/i,
  ];

  for (const art of artifacts) {
    const c = art.contentJson;
    const spec = c.visualSpec;
    const url = spec?.fetchedImageUrl || spec?.imageUrl || "";
    const title = (spec?.title || "").trim();

    if (url && typeof url === "string") {
      for (const pattern of genericPatterns) {
        if (pattern.test(url)) {
          findings.push({
            slideNo: art.slideNo,
            message: `Generic stock image source detected: "${url.slice(0, 60)}" — replace with concept-specific domain diagram.`,
          });
          break;
        }
      }

      // If the visual title is very generic (doesn't describe concept)
      if (title && title.length < 10 && url.startsWith("http")) {
        findings.push({
          slideNo: art.slideNo,
          message: `Visual title is too generic: "${title}" — should describe the specific concept being visualized`,
        });
      }
    }
  }

  // 3. Multi-factor semantic visual specification deduplication
  const registry = new VisualDeduplicationRegistry();

  for (const art of artifacts) {
    const c = art.contentJson;
    const spec = c.visualSpec;

    if (spec && typeof spec === "object") {
      const check = registry.register(spec as VisualSpecification, art.slideNo);
      if (!check.isUnique) {
        findings.push({
          slideNo: art.slideNo,
          message:
            check.reason ||
            `Visual specification on slide ${art.slideNo} is semantically duplicate (${((check.similarityScore || 0) * 100).toFixed(1)}% similarity) — pairwise similarity must be < ${(MAX_VISUAL_SIMILARITY_THRESHOLD * 100).toFixed(0)}%.`,
        });
      }
    }
  }

  const status = findings.length > 4 ? "fail" : findings.length > 0 ? "warn" : "pass";

  return {
    gateKey: "visual_uniqueness",
    severity: "warning",
    status: status as any,
    findings,
    ruleVersion: "2.0",
  };
}
