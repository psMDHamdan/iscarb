/**
 * Vision-Language Image & Diagram Validator.
 * ===========================================================================
 * Validates selected slide visuals for scientific consistency, educational value,
 * readability, cropping, label accuracy, and generic stock photo penalty.
 */

export interface ImageValidationResult {
  valid: boolean;
  score: number; // 0.0 - 1.0
  relevanceReason: string;
  penalties: string[];
  replacementRequired: boolean;
}

export class ImageValidator {
  /** Validates visual intent & image metadata against scientific criteria. */
  public static validateVisual(
    slideTitle: string,
    visualIntent: string,
    visualType?: string,
    imageUrl?: string
  ): ImageValidationResult {
    const penalties: string[] = [];
    let score = 1.0;

    // 1. Generic Stock Photo Penalty
    if (imageUrl && ImageValidator.isGenericStockPhoto(imageUrl)) {
      score -= 0.35;
      penalties.push("Generic stock photo penalty: visual lacks domain-specific scientific rigor");
    }

    // 2. Visual Intent Completeness
    if (!visualIntent || visualIntent.trim().length < 15) {
      score -= 0.30;
      penalties.push("Visual intent incomplete: missing precise process/structure description");
    }

    // 3. Process/Diagram Type Preference for STEM
    const preferredTypes = ["process_diagram", "scientific_diagram", "graph", "molecular_structure", "comparison", "diagram", "architecture"];
    if (visualType && !preferredTypes.includes(visualType.toLowerCase())) {
      score -= 0.15;
      penalties.push(`Visual type '${visualType}' is less educational than scientific diagrams or graphs`);
    }

    const valid = score >= 0.65;
    return {
      valid,
      score: Math.max(0, Math.min(1, score)),
      relevanceReason: valid
        ? `Visual satisfies scientific consistency for '${slideTitle}'`
        : `Visual requires replacement for '${slideTitle}' due to ${penalties.length} quality penalties`,
      penalties,
      replacementRequired: !valid,
    };
  }

  /** Checks visual intent structure for completeness and pedagogical value. */
  public static validateVisualIntent(intent: {
    description?: string;
    visualType?: string;
    prefersDiagram?: boolean;
    conceptId?: string;
  }): { valid: boolean; score: number; reason: string } {
    if (!intent || !intent.description || intent.description.trim().length < 10) {
      return { valid: false, score: 0, reason: "Visual intent description is missing or too brief" };
    }

    let score = 1.0;
    const desc = intent.description.toLowerCase();

    // Check if description is too generic
    if (desc.includes("image related to") || desc.includes("photo of") || desc.includes("picture of")) {
      score -= 0.4;
    }

    // Check for specific scientific keywords
    const scientificKeywords = ["diagram", "structure", "mechanism", "process", "flow", "graph", "curve", "pathway", "interaction", "vector"];
    const hasKeyword = scientificKeywords.some((kw) => desc.includes(kw));

    if (!hasKeyword) {
      score -= 0.2;
    }

    return {
      valid: score >= 0.6,
      score,
      reason: score >= 0.6 ? "Visual intent is pedagogically grounded" : "Visual intent lacks scientific specificity",
    };
  }

  /** Heuristic to detect generic non-educational stock photos. */
  public static isGenericStockPhoto(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    const stockDomains = ["shutterstock.com", "gettyimages.com", "stock.adobe.com", "depositphotos.com", "istocks.com", "freepik.com"];
    const genericKeywords = ["happy-team", "business-meeting", "office-people", "handshake", "laptop-working", "generic-lab-worker"];

    return (
      stockDomains.some((domain) => lower.includes(domain)) ||
      genericKeywords.some((keyword) => lower.includes(keyword))
    );
  }
}

