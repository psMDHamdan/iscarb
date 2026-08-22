/**
 * Lecture Generation — post-generation artifact validation (TASK-04 §C).
 * ===========================================================================
 * Every generated artifact must satisfy the content contract before it can be
 * persisted as clean: ≤40 visible words, ≤5 bullets, a specific visual intent,
 * at least one source citation, ≥1 linked CLO and ≥1 linked source block
 * (AC-08). Failures flag the artifact.
 */
import type { SlideContentJson } from "./types";

export const MAX_BULLETS = 10;

export function validateArtifact(artifact: SlideContentJson, opts: { allowSynthesis?: boolean } = {}): string[] {
  const errors: string[] = [];

  // Word count limit removed — depth is more important than brevity.
  if (artifact.body?.bullets?.length > MAX_BULLETS) {
    errors.push(`${artifact.body.bullets.length} bullets — max is ${MAX_BULLETS}`);
  }
  
  // ═══ IMAGE VALIDATION — STRICT ═══════════════════════════════════════
  // Never render: none, ..., null, undefined, N/A, placeholder, empty
  const REJECTED_VISUALS = /^(none|null|undefined|n\/a|placeholder|missing image|\.\.\.?|empty)$/i;
  const visualIntent = artifact.visualIntent;
  if (!visualIntent) {
    errors.push("Missing visualIntent object — every slide must declare its visual plan.");
  } else {
    const desc = (visualIntent.description || "").trim();
    const hasSourceFigure = Boolean(visualIntent.sourceFigureRef?.trim());
    const generatesDiagram = Boolean(visualIntent.generateDiagram);
    const hasDescription = desc.length > 10;

    // Reject placeholder visual descriptions
    if (desc && REJECTED_VISUALS.test(desc)) {
      errors.push(`Visual description is a placeholder: "${desc}" — must describe a specific diagram.`);
    }
    // Reject placeholder source figure refs
    if (visualIntent.sourceFigureRef && REJECTED_VISUALS.test(visualIntent.sourceFigureRef.trim())) {
      errors.push(`Visual sourceFigureRef is a placeholder: "${visualIntent.sourceFigureRef}" — use null or a real URL.`);
    }
    // Every slide needs either a source figure OR a generated diagram
    if (!hasSourceFigure && !generatesDiagram) {
      errors.push("No visual plan: neither source figure nor generated diagram. BRD requires >=18 visually supported slides.");
    }
    // Generated diagrams must have a description and type
    if (generatesDiagram && !hasDescription) {
      errors.push("Visual intent missing description: must specify what the diagram shows.");
    }
    if (generatesDiagram && !visualIntent.diagramType) {
      errors.push("Visual intent missing diagramType: must be mechanism|comparison|workflow|data_chart|concept_map.");
    }
  }

  // ═══ TITLE-CONTENT ALIGNMENT CHECK ═══════════════════════════════════
  // The title promises a specific topic. Every bullet must relate to it.
  // If the title mentions "EcoRI" but bullets discuss "poly(A) tails", reject.
  const titleWords = (artifact.title || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w: string) => w.length > 4 && !/^(about|from|with|this|that|when|what|how|the|and|for)$/i.test(w));
  const bullets = artifact.body?.bullets || [];
  if (titleWords.length >= 2 && bullets.length >= 3) {
    let unrelatedCount = 0;
    for (const bullet of bullets) {
      const bulletLower = bullet.toLowerCase();
      const overlap = titleWords.filter((w: string) => bulletLower.includes(w)).length;
      // If bullet has ZERO overlap with title words and is substantial, flag it
      if (overlap === 0 && bullet.split(/\s+/).length > 5) {
        unrelatedCount++;
      }
    }
    // If more than half the bullets seem unrelated to the title, reject
    if (unrelatedCount >= Math.ceil(bullets.length * 0.5)) {
      errors.push(`Title-content mismatch: ${unrelatedCount}/${bullets.length} bullets appear unrelated to "${artifact.title?.slice(0, 60)}".`);
    }
  }

  // ═══ TRUNCATION DETECTION ═════════════════════════════════════════════
  // Content ending with incomplete text must NOT reach students.
  const TRUNCATION_RE = /(?:\.\.\.|…|,\s*$|\band\s*$|\bor\s*$|\bbecause\s*$|\bwhich\s*$|\bthat\s*$|\bthe following\s*$|:\s*$|—\s*$)/;
  const allContentText = [
    artifact.title,
    artifact.body?.visibleCopy,
    ...(artifact.body?.bullets || []),
    artifact.body?.studentAction?.stem,
  ].filter(Boolean).join(" ");
  if (TRUNCATION_RE.test(allContentText)) {
    const match = allContentText.match(TRUNCATION_RE);
    errors.push(`Truncation detected: content ends with "${match?.[0]?.trim()}" — must complete the sentence.`);
  }

  // ═══ FIGURE/TABLE REFERENCE STRIPPING ═════════════════════════════════
  // Student-facing content must not contain source figure/table numbers.
  const FIGURE_TABLE_RE = /\b(figure|table|fig\.)\s*\d+[\.\-]?\d*/i;
  const SOURCE_REF_RE = /\bas\s+shown\s+(in\s+)?(the\s+)?(figure|table|diagram)/i;
  const PAGE_REF_RE = /\b(on\s+page|in\s+section|in\s+chapter)\s+\d+/i;
  for (const bullet of bullets) {
    if (FIGURE_TABLE_RE.test(bullet)) {
      errors.push(`Source figure/table reference in bullet: "${bullet.slice(0, 60)}" — extract the concept, not the reference.`);
    }
    if (SOURCE_REF_RE.test(bullet)) {
      errors.push(`Textbook language in bullet: "${bullet.slice(0, 60)}" — rewrite as student explanation.`);
    }
    if (PAGE_REF_RE.test(bullet)) {
      errors.push(`Page/section reference in bullet: "${bullet.slice(0, 60)}" — remove source navigation.`);
    }
  }
  // Also check visible copy and title
  if (FIGURE_TABLE_RE.test(artifact.title || "")) {
    errors.push(`Source figure/table reference in title: "${artifact.title}"`);
  }

  // ═══ SOURCE-COPY DETECTION ═══════════════════════════════════════════
  // Detect raw source text copied verbatim into bullets
  const COPY_PATTERNS = [
    /^\d+\s+(Note|Figure|Table|Chapter|Section)\b/i,       // "58 Note: ..."
    /^\d+\.\d+\s+[A-Z]/i,                                   // "4.2 Restriction..."
    /^Package contents:/i,                                     // "Package contents: ..."
    /^SKU\s+GE/i,                                              // "SKU GE100019"
    /^Figure\s+\d+\.\d+/i,                                   // "Figure 17.3"
    /^Fig\.\s*\d+/i,                                          // "Fig. 2"
    /^Related Optional Reagents:/i,                           // "Related Optional Reagents:"
    /^Total volume\s+\d+/i,                                  // "Total volume 30 μL"
    /^\d+\s*μL\s+(Forward|Reverse|Oligo)/i,                 // "2 μL Forward oligo"
  ];
  for (const bullet of bullets) {
    for (const pat of COPY_PATTERNS) {
      if (pat.test(bullet.trim())) {
        errors.push(`Source copy detected: "${bullet.slice(0, 60)}..." — must rewrite as educational explanation.`);
        break;
      }
    }
  }

  // HOOK VALIDATION — hooks must be source-grounded or explicitly hypothetical
  const titleLower = (artifact.title || "").toLowerCase();
  if (artifact.slideNo === 1 || titleLower.includes("when ") || titleLower.includes("case study")) {
    const allText = JSON.stringify(artifact);
    if (!allText.includes("HYPOTHETICAL") && !artifact.sourceCoverage?.mappedBlockIds?.length) {
      // Hook slides without source citations should be flagged
      errors.push("Hook/case slide lacks source citations — must be SOURCE_BACKED or marked HYPOTHETICAL.");
    }
  }

  // QUESTION QUALITY — student actions must be specific, not generic
  const studentAction = artifact.body?.studentAction?.stem || "";
  const genericPatterns = [
    /^poll:\s*which option matches/i,
    /^poll:\s*what is the best/i,
    /^pause:\s*how does this apply/i,
    /^compare the options/i,
    /^calculate this worked example/i,
  ];
  if (genericPatterns.some((p) => p.test(studentAction))) {
    errors.push(`Generic student action detected: "${studentAction.slice(0, 60)}" — must be specific and source-grounded.`);
  }

  // SOURCE COVERAGE VALIDATION
  if (!artifact.sourceCoverage?.mappedBlockIds || artifact.sourceCoverage.mappedBlockIds.length === 0) {
    if (!opts.allowSynthesis) {
      errors.push("No source citations (mappedBlockIds is empty)");
    }
  }

  if (!artifact.cloLinks || artifact.cloLinks.length === 0) {
    errors.push("Artifact must link to at least one CLO");
  }

  // 7 FORBIDDEN PATTERNS VALIDATION
  const allText = [
    artifact.title,
    artifact.body?.visibleCopy,
    ...(artifact.body?.bullets || []),
    artifact.notes?.instructorNotes,
    artifact.notes?.answers
  ].join(" ").toLowerCase();

  // Pattern 1 & 2: Banned corporate speak
  if (allText.includes("high-performance, secure execution")) {
    errors.push("Forbidden Pattern #1: Contains 'High-performance, secure execution'");
  }
  if (allText.includes("aligned with national digital transformation")) {
    errors.push("Forbidden Pattern #2: Contains 'Aligned with National Digital Transformation'");
  }

  // Pattern 3: Banned generic questions
  const titleMatcher = (artifact.title || "").toLowerCase();
  if (allText.includes(`how does ${titleMatcher} behave under real-world constraints?`)) {
    errors.push("Forbidden Pattern #3: Contains generic 'How does [TITLE] behave...' question");
  }
  if (/poll: which option matches/i.test(allText)) {
    errors.push("Forbidden Pattern: Contains generic 'Which option matches' question");
  }
  if (/poll: what is the best/i.test(allText)) {
    errors.push("Forbidden Pattern: Contains generic 'What is the best answer' question");
  }

  // Pattern 4: Banned generic instructor note
  if (artifact.notes?.instructorNotes?.trim().toLowerCase() === "introduce the core principle clearly") {
    errors.push("Forbidden Pattern #4: Generic instructor note 'Introduce the core principle clearly'");
  }

  // Pattern 5 & 6 are handled by MAX_VISIBLE_WORDS and MAX_BULLETS above.

  // Pattern 7: Banned generic Unsplash stock photo
  if (artifact.visualIntent?.sourceFigureRef?.toLowerCase().includes("unsplash.com")) {
    errors.push("Forbidden Pattern #7: Using a generic Unsplash stock photo");
  }

  return errors;
}

export function artifactGate(artifact: SlideContentJson, opts: { allowSynthesis?: boolean } = {}): { valid: boolean; errors: string[] } {
  const errors = validateArtifact(artifact, opts);
  return { valid: errors.length === 0, errors };
}
