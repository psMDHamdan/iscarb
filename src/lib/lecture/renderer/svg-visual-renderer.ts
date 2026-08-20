/**
 * SVG Visual Renderer — native diagram engine for the iSCARB Student Workbench.
 *
 * Interprets `visualIntent` strings or structured `VisualSpecification` objects
 * and returns a self-contained, accessible vector SVG string.
 *
 * Supports both:
 * 1. The 7 Canonical Visual Families (Milestone 3):
 *    - PROCESS
 *    - SYSTEM_ARCHITECTURE
 *    - DATA_FLOW
 *    - COMPARISON_MATRIX
 *    - CAUSE_EFFECT
 *    - QUANTITATIVE
 *    - HIERARCHY
 * 2. The 7 Legacy Template Intents:
 *    - HUB_SPOKE
 *    - LAYER_STACK
 *    - CHAIN
 *    - VENN
 *    - FUNNEL
 *    - MATRIX
 *    - TIMELINE
 *
 * All produced SVGs include:
 *   • role="img" on the root <svg>
 *   • <title id="vis-title-...">
 *   • <desc id="vis-desc-...">
 *   • aria-labelledby="vis-title-... vis-desc-..."
 */

import type { VisualSpecification, VisualFamily, VisualNode, VisualConnection } from "../visual/types";

// ---------------------------------------------------------------------------
// Color palette & theme constants
// ---------------------------------------------------------------------------

export const BRAND = {
  primary: "#0E6C3C",
  darkGreen: "#094A29",
  teal: "#0F7B8A",
  cyan: "#06B6D4",
  gold: "#F59E0B",
  purple: "#8B5CF6",
  slate: "#64748B",
  darkBg: "#0F172A",
  cardBg: "#1E293B",
  cardBorder: "#334155",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  accent: "#10B981",
  danger: "#EF4444",
};

export const NODE_FILLS = [
  BRAND.teal,
  BRAND.cyan,
  BRAND.primary,
  BRAND.gold,
  BRAND.purple,
  "#3B82F6",
  "#10B981",
  "#F97316",
];

// ---------------------------------------------------------------------------
// Supported diagram types
// ---------------------------------------------------------------------------

export type VisualIntent =
  | "HUB_SPOKE"
  | "LAYER_STACK"
  | "CHAIN"
  | "VENN"
  | "FUNNEL"
  | "MATRIX"
  | "TIMELINE"
  | VisualFamily;

export const SUPPORTED_INTENTS: ReadonlySet<string> = new Set<string>([
  "HUB_SPOKE",
  "LAYER_STACK",
  "CHAIN",
  "VENN",
  "FUNNEL",
  "MATRIX",
  "TIMELINE",
  "PROCESS",
  "SYSTEM_ARCHITECTURE",
  "DATA_FLOW",
  "COMPARISON_MATRIX",
  "CAUSE_EFFECT",
  "QUANTITATIVE",
  "HIERARCHY",
]);

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

export function escapeXml(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapLabel(
  text: string,
  x: number,
  startY: number,
  maxChars: number,
  lineHeight: number,
  attrs: string = ""
): string {
  const words = String(text || "").split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);

  return lines
    .map(
      (line, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}" ${attrs}>${escapeXml(line)}</tspan>`
    )
    .join("");
}

function svgWrap(
  slideNo: number,
  visualIntent: string,
  width: number,
  height: number,
  inner: string
): string {
  const titleId = `vis-title-${slideNo}`;
  const descId = `vis-desc-${slideNo}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${titleId} ${descId}">
  <title id="${titleId}">${escapeXml(visualIntent)} Diagram</title>
  <desc id="${descId}">Instructional diagram illustrating ${escapeXml(visualIntent)}</desc>
  ${inner}
</svg>`;
}

// ---------------------------------------------------------------------------
// Canonical 7 Visual Family Renderers
// ---------------------------------------------------------------------------

/**
 * 1. PROCESS: Sequential states, algorithmic stages, or cyclical transitions
 */
function renderProcessFamilySvg(spec: VisualSpecification, width: number, height: number, id: string): string {
  const nodes = spec.nodes.length > 0 ? spec.nodes : (spec.elements || []);
  const n = Math.max(1, nodes.length);
  const paddingX = 40;
  const paddingY = 80;
  const usableWidth = width - paddingX * 2;
  const cardWidth = Math.min(180, (usableWidth - (n - 1) * 30) / n);
  const cardHeight = 130;
  const cardY = paddingY + (height - paddingY - 100 - cardHeight) / 2;

  const elements: string[] = [];

  // Render Defs
  elements.push(`
    <defs>
      <linearGradient id="grad-proc-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0E6C3C" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#0F7B8A" stop-opacity="0.9" />
      </linearGradient>
      <marker id="arrow-proc-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="${BRAND.cyan}" />
      </marker>
    </defs>
  `);

  // Render Nodes
  nodes.forEach((node, i) => {
    const cardX = paddingX + i * ((usableWidth - cardWidth) / Math.max(1, n - 1));
    const stepNo = String(i + 1).padStart(2, "0");
    const fill = i === n - 1 ? BRAND.primary : i === 0 ? BRAND.teal : BRAND.cardBg;

    elements.push(`
      <g class="process-node" transform="translate(${cardX.toFixed(1)}, ${cardY.toFixed(1)})">
        <rect width="${cardWidth}" height="${cardHeight}" rx="10" fill="${fill}" stroke="${BRAND.cyan}" stroke-width="1.5" />
        <circle cx="24" cy="24" r="14" fill="${BRAND.gold}" />
        <text x="24" y="29" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#0F172A" text-anchor="middle">${stepNo}</text>
        <text x="${cardWidth / 2 + 10}" y="28" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="${BRAND.textPrimary}" text-anchor="middle">
          ${wrapLabel(node.label, cardWidth / 2 + 10, 24, 16, 14)}
        </text>
        <text x="${cardWidth / 2}" y="70" font-family="system-ui, sans-serif" font-size="11" fill="${BRAND.textSecondary}" text-anchor="middle">
          ${wrapLabel(node.description || node.type || "Active Phase", cardWidth / 2, 70, 18, 13)}
        </text>
      </g>
    `);

    // Render connection arrow to next node
    if (i < n - 1) {
      const nextX = paddingX + (i + 1) * ((usableWidth - cardWidth) / Math.max(1, n - 1));
      const startX = cardX + cardWidth + 4;
      const endX = nextX - 8;
      const arrowY = cardY + cardHeight / 2;
      const conn = spec.connections.find((c) => c.from === node.id) || spec.connections[i];
      const connLabel = conn?.label ? escapeXml(conn.label) : "";

      elements.push(`
        <path d="M ${startX.toFixed(1)} ${arrowY.toFixed(1)} L ${endX.toFixed(1)} ${arrowY.toFixed(1)}" stroke="${BRAND.cyan}" stroke-width="2.5" marker-end="url(#arrow-proc-${id})" />
        ${connLabel ? `<rect x="${((startX + endX) / 2 - 30).toFixed(1)}" y="${(arrowY - 20).toFixed(1)}" width="60" height="16" rx="4" fill="#0F172A" stroke="${BRAND.slate}" stroke-width="1"/>
        <text x="${((startX + endX) / 2).toFixed(1)}" y="${(arrowY - 8).toFixed(1)}" font-family="system-ui, sans-serif" font-size="10" fill="${BRAND.gold}" text-anchor="middle">${connLabel}</text>` : ""}
      `);
    }
  });

  return elements.join("\n");
}

/**
 * 2. SYSTEM_ARCHITECTURE: Tiered subsystems, boundary modules, ports, and protocols
 */
function renderSystemArchitectureFamilySvg(spec: VisualSpecification, width: number, height: number, id: string): string {
  const nodes = spec.nodes.length > 0 ? spec.nodes : (spec.elements || []);
  const elements: string[] = [];

  elements.push(`
    <defs>
      <marker id="arrow-arch-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="${BRAND.gold}" />
      </marker>
    </defs>
  `);

  // Render 3 tiers: Client / Interface, Core Logic / Services, Persistence / Data
  const tiers = [
    { name: "Presentation & Client Interface", y: 70, height: 75, color: "#1E293B" },
    { name: "Core Subsystems & Business Logic", y: 165, height: 85, color: "#1E293B" },
    { name: "Persistence, Storage & Invariant Layer", y: 270, height: 75, color: "#1E293B" },
  ];

  tiers.forEach((tier) => {
    elements.push(`
      <rect x="40" y="${tier.y}" width="${width - 80}" height="${tier.height}" rx="8" fill="${tier.color}" stroke="${BRAND.cardBorder}" stroke-dasharray="4,4" />
      <text x="55" y="${tier.y + 18}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="${BRAND.textSecondary}" letter-spacing="0.5">${tier.name.toUpperCase()}</text>
    `);
  });

  // Distribute nodes across tiers
  nodes.forEach((node, i) => {
    const tierIdx = i % 3;
    const tier = tiers[tierIdx];
    const nodesInTier = nodes.filter((_, idx) => idx % 3 === tierIdx);
    const posInTier = nodesInTier.indexOf(node);
    const nodeWidth = Math.min(200, (width - 120 - (nodesInTier.length - 1) * 20) / nodesInTier.length);
    const nodeX = 60 + posInTier * (nodeWidth + 20);
    const nodeY = tier.y + 26;

    elements.push(`
      <g class="arch-node" transform="translate(${nodeX.toFixed(1)}, ${nodeY.toFixed(1)})">
        <rect width="${nodeWidth}" height="40" rx="6" fill="${NODE_FILLS[i % NODE_FILLS.length]}" stroke="${BRAND.cyan}" stroke-width="1.5" />
        <text x="${nodeWidth / 2}" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#FFFFFF" text-anchor="middle">
          ${escapeXml(node.label)}
        </text>
      </g>
    `);
  });

  // Render vertical/cross-tier connection arrows
  spec.connections.forEach((conn, i) => {
    const fromIdx = nodes.findIndex((n) => n.id === conn.from);
    const toIdx = nodes.findIndex((n) => n.id === conn.to);
    if (fromIdx !== -1 && toIdx !== -1) {
      const startX = 120 + (fromIdx % 3) * 160;
      const startY = tiers[fromIdx % 3].y + 65;
      const endY = tiers[toIdx % 3].y + 25;
      elements.push(`
        <path d="M ${startX} ${startY} L ${startX} ${endY}" stroke="${BRAND.gold}" stroke-width="2" marker-end="url(#arrow-arch-${id})" />
        ${conn.label ? `<text x="${startX + 8}" y="${(startY + endY) / 2}" font-family="system-ui, sans-serif" font-size="10" fill="${BRAND.cyan}">${escapeXml(conn.label)}</text>` : ""}
      `);
    }
  });

  return elements.join("\n");
}

/**
 * 3. DATA_FLOW: Ingestion, transformation pipelines, message queues, and sinks
 */
function renderDataFlowFamilySvg(spec: VisualSpecification, width: number, height: number, id: string): string {
  const nodes = spec.nodes.length > 0 ? spec.nodes : (spec.elements || []);
  const elements: string[] = [];

  elements.push(`
    <defs>
      <marker id="arrow-flow-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="${BRAND.cyan}" />
      </marker>
    </defs>
  `);

  const n = Math.max(1, nodes.length);
  const startX = 60;
  const endX = width - 60;
  const centerY = height / 2 - 10;

  // Pipeline stream line
  elements.push(`
    <line x1="${startX}" y1="${centerY}" x2="${endX}" y2="${centerY}" stroke="#334155" stroke-width="6" stroke-linecap="round" />
  `);

  nodes.forEach((node, i) => {
    const cx = startX + i * ((endX - startX) / Math.max(1, n - 1));
    const cy = centerY;
    const r = 36;
    const isSource = i === 0;
    const isSink = i === n - 1;
    const fill = isSource ? BRAND.primary : isSink ? BRAND.teal : BRAND.cardBg;

    elements.push(`
      <g class="flow-node" transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)})">
        <circle r="${r}" fill="${fill}" stroke="${BRAND.cyan}" stroke-width="2" />
        <circle r="${r - 8}" fill="none" stroke="${BRAND.gold}" stroke-width="1.5" stroke-dasharray="3,3" />
        <text y="4" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
          ${wrapLabel(node.label, 0, 0, 10, 12)}
        </text>
        <text y="${r + 20}" font-family="system-ui, sans-serif" font-size="11" fill="${BRAND.textSecondary}" text-anchor="middle">
          ${escapeXml(node.description || (isSource ? "Input Stream" : isSink ? "Output Storage" : "Transformer"))}
        </text>
      </g>
    `);

    if (i < n - 1) {
      const nextCx = startX + (i + 1) * ((endX - startX) / Math.max(1, n - 1));
      const midX = (cx + nextCx) / 2;
      const conn = spec.connections.find((c) => c.from === node.id) || spec.connections[i];
      const label = conn?.label ? escapeXml(conn.label) : "stream";

      elements.push(`
        <path d="M ${cx + r + 4} ${cy} L ${nextCx - r - 4} ${cy}" stroke="${BRAND.cyan}" stroke-width="2.5" marker-end="url(#arrow-flow-${id})" />
        <rect x="${midX - 35}" y="${cy - 28}" width="70" height="18" rx="4" fill="#0F172A" stroke="${BRAND.slate}" stroke-width="1" />
        <text x="${midX}" y="${cy - 16}" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="${BRAND.gold}" text-anchor="middle">
          ${label}
        </text>
      `);
    }
  });

  return elements.join("\n");
}

/**
 * 4. COMPARISON_MATRIX: Side-by-side or multidimensional trade-off grid
 */
function renderComparisonMatrixFamilySvg(spec: VisualSpecification, width: number, height: number): string {
  const nodes = spec.nodes.length > 0 ? spec.nodes : (spec.elements || []);
  const elements: string[] = [];

  const startX = 50;
  const startY = 70;
  const matrixWidth = width - 100;
  const matrixHeight = height - 150;
  const colCount = Math.max(2, Math.min(4, nodes.length));
  const colWidth = matrixWidth / colCount;

  // Header background
  elements.push(`
    <rect x="${startX}" y="${startY}" width="${matrixWidth}" height="${matrixHeight}" rx="10" fill="${BRAND.cardBg}" stroke="${BRAND.cardBorder}" stroke-width="1.5" />
    <rect x="${startX}" y="${startY}" width="${matrixWidth}" height="40" rx="10" fill="#1E293B" stroke="${BRAND.cardBorder}" stroke-width="1.5" />
  `);

  nodes.slice(0, colCount).forEach((node, i) => {
    const colX = startX + i * colWidth;
    const isHighlight = i === 0;

    elements.push(`
      <text x="${colX + colWidth / 2}" y="${startY + 25}" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="${isHighlight ? BRAND.cyan : BRAND.gold}" text-anchor="middle">
        ${escapeXml(node.label)}
      </text>
      <line x1="${colX + colWidth}" y1="${startY}" x2="${colX + colWidth}" y2="${startY + matrixHeight}" stroke="${BRAND.cardBorder}" stroke-width="1" />
    `);

    // Dimensions/features in column
    const features = [
      { name: "Time / Complexity", val: node.metadata?.complexity || (i === 0 ? "O(1) Direct" : "O(N) Iterative") },
      { name: "Memory Footprint", val: node.metadata?.memory || (i === 0 ? "Compact" : "Buffered") },
      { name: "Fault Tolerance", val: node.metadata?.faultTolerance || (i === 0 ? "Guaranteed" : "Conditional") },
      { name: "Mechanism Rationale", val: node.description || "Valid Invariant" },
    ];

    features.forEach((feat, fIdx) => {
      const rowY = startY + 50 + fIdx * 45;
      if (i === 0) {
        elements.push(`
          <line x1="${startX}" y1="${rowY + 35}" x2="${startX + matrixWidth}" y2="${rowY + 35}" stroke="${BRAND.cardBorder}" stroke-width="0.5" stroke-dasharray="2,2" />
        `);
      }
      elements.push(`
        <text x="${colX + 15}" y="${rowY + 16}" font-family="system-ui, sans-serif" font-size="10" fill="${BRAND.textSecondary}">${feat.name}:</text>
        <text x="${colX + 15}" y="${rowY + 30}" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="${BRAND.textPrimary}">${escapeXml(String(feat.val))}</text>
      `);
    });
  });

  return elements.join("\n");
}

/**
 * 5. CAUSE_EFFECT: Root cause, intermediary mechanisms, and outcome branches
 */
function renderCauseEffectFamilySvg(spec: VisualSpecification, width: number, height: number, id: string): string {
  const nodes = spec.nodes.length > 0 ? spec.nodes : (spec.elements || []);
  const elements: string[] = [];

  elements.push(`
    <defs>
      <marker id="arrow-ce-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="${BRAND.cyan}" />
      </marker>
    </defs>
  `);

  const causeNode = nodes[0] || { label: "Root Trigger Condition", description: "Initial State" };
  const mechNode = nodes[1] || { label: "Mediating Mechanism", description: "Invariant Dynamics" };
  const effectNodes = nodes.slice(2).length > 0 ? nodes.slice(2) : [{ label: "Observable Effect α" }, { label: "Observable Effect β" }];

  // 1. Root Cause Card (Left)
  elements.push(`
    <g transform="translate(50, ${height / 2 - 60})">
      <rect width="180" height="90" rx="8" fill="#1E293B" stroke="${BRAND.gold}" stroke-width="2" />
      <rect width="180" height="24" rx="8" fill="${BRAND.gold}" />
      <text x="90" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0F172A" text-anchor="middle">ROOT CAUSE / TRIGGER</text>
      <text x="90" y="48" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#FFFFFF" text-anchor="middle">
        ${wrapLabel(causeNode.label, 90, 48, 16, 14)}
      </text>
    </g>
  `);

  // 2. Mediating Mechanism (Center)
  elements.push(`
    <g transform="translate(300, ${height / 2 - 60})">
      <rect width="180" height="90" rx="8" fill="#1E293B" stroke="${BRAND.cyan}" stroke-width="2" />
      <rect width="180" height="24" rx="8" fill="${BRAND.cyan}" />
      <text x="90" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0F172A" text-anchor="middle">MECHANISM MEDIATOR</text>
      <text x="90" y="48" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#FFFFFF" text-anchor="middle">
        ${wrapLabel(mechNode.label, 90, 48, 16, 14)}
      </text>
    </g>
    <path d="M 230 ${height / 2 - 15} L 296 ${height / 2 - 15}" stroke="${BRAND.cyan}" stroke-width="2.5" marker-end="url(#arrow-ce-${id})" />
  `);

  // 3. Effects (Right Branching)
  const effectCount = effectNodes.length;
  const startEffY = height / 2 - (effectCount * 70) / 2;

  effectNodes.forEach((eff, idx) => {
    const effY = startEffY + idx * 75;
    elements.push(`
      <g transform="translate(550, ${effY.toFixed(1)})">
        <rect width="190" height="60" rx="8" fill="#1E293B" stroke="${BRAND.accent}" stroke-width="1.5" />
        <text x="15" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="${BRAND.accent}">OUTCOME ${idx + 1}</text>
        <text x="15" y="42" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#FFFFFF">
          ${escapeXml(eff.label)}
        </text>
      </g>
      <path d="M 480 ${height / 2 - 15} C 510 ${height / 2 - 15}, 520 ${effY + 30}, 546 ${effY + 30}" fill="none" stroke="${BRAND.accent}" stroke-width="2" marker-end="url(#arrow-ce-${id})" />
    `);
  });

  return elements.join("\n");
}

/**
 * 6. QUANTITATIVE: Coordinate axes, curves, distributions, parameter sensitivity
 */
function renderQuantitativeFamilySvg(spec: VisualSpecification, width: number, height: number, id: string): string {
  const elements: string[] = [];

  const originX = 90;
  const originY = height - 110;
  const plotWidth = width - 180;
  const plotHeight = height - 180;

  // Grid and Axes
  elements.push(`
    <rect x="${originX}" y="${originY - plotHeight}" width="${plotWidth}" height="${plotHeight}" fill="#1E293B" rx="6" />
    <!-- Grid Lines -->
    <line x1="${originX}" y1="${originY - plotHeight / 2}" x2="${originX + plotWidth}" y2="${originY - plotHeight / 2}" stroke="#334155" stroke-width="1" stroke-dasharray="4,4" />
    <line x1="${originX + plotWidth / 2}" y1="${originY - plotHeight}" x2="${originX + plotWidth / 2}" y2="${originY}" stroke="#334155" stroke-width="1" stroke-dasharray="4,4" />
    <!-- Axes -->
    <line x1="${originX}" y1="${originY}" x2="${originX + plotWidth + 20}" y2="${originY}" stroke="${BRAND.textSecondary}" stroke-width="2.5" />
    <line x1="${originX}" y1="${originY}" x2="${originX}" y2="${originY - plotHeight - 20}" stroke="${BRAND.textSecondary}" stroke-width="2.5" />
    <!-- Axis Labels -->
    <text x="${originX + plotWidth + 10}" y="${originY + 25}" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="${BRAND.cyan}" text-anchor="middle">Parameter (X)</text>
    <text x="${originX - 15}" y="${originY - plotHeight - 10}" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="${BRAND.gold}" text-anchor="end">Performance / Value (Y)</text>
  `);

  // Function Curve (Smooth Sigmoid / Exponential Transition)
  const curvePath = `M ${originX} ${originY - 10} C ${originX + plotWidth * 0.35} ${originY - 15}, ${originX + plotWidth * 0.45} ${originY - plotHeight * 0.85}, ${originX + plotWidth} ${originY - plotHeight * 0.92}`;

  elements.push(`
    <path d="${curvePath}" fill="none" stroke="${BRAND.cyan}" stroke-width="3.5" />
    <!-- Highlighted Optimal/Inflection Point -->
    <circle cx="${originX + plotWidth * 0.5}" cy="${originY - plotHeight * 0.55}" r="7" fill="${BRAND.gold}" stroke="#FFFFFF" stroke-width="2" />
    <rect x="${originX + plotWidth * 0.5 + 15}" y="${originY - plotHeight * 0.55 - 25}" width="160" height="42" rx="6" fill="#0F172A" stroke="${BRAND.gold}" stroke-width="1" />
    <text x="${originX + plotWidth * 0.5 + 25}" y="${originY - plotHeight * 0.55 - 10}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="${BRAND.gold}">Critical Invariant Point</text>
    <text x="${originX + plotWidth * 0.5 + 25}" y="${originY - plotHeight * 0.55 + 6}" font-family="system-ui, sans-serif" font-size="10" fill="${BRAND.textSecondary}">${escapeXml(spec.nodes[0]?.label || "Optimal Trade-off")}</text>
  `);

  return elements.join("\n");
}

/**
 * 7. HIERARCHY: Tree structures, taxonomy, organizational inheritance DAGs
 */
function renderHierarchyFamilySvg(spec: VisualSpecification, width: number, height: number, id: string): string {
  const nodes = spec.nodes.length > 0 ? spec.nodes : (spec.elements || []);
  const elements: string[] = [];

  const rootNode = nodes[0] || { label: "Root Concept", description: "Top Level Taxonomy" };
  const childNodes = nodes.slice(1, 4).length > 0 ? nodes.slice(1, 4) : [{ label: "Sub-Class A" }, { label: "Sub-Class B" }, { label: "Sub-Class C" }];
  const leafNodes = nodes.slice(4).length > 0 ? nodes.slice(4) : [{ label: "Leaf Node 1" }, { label: "Leaf Node 2" }];

  const rootX = width / 2;
  const rootY = 85;

  // Root Node
  elements.push(`
    <g transform="translate(${rootX - 100}, ${rootY})">
      <rect width="200" height="45" rx="8" fill="${BRAND.primary}" stroke="${BRAND.cyan}" stroke-width="2" />
      <text x="100" y="27" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(rootNode.label)}</text>
    </g>
  `);

  // Tier 2 Child Nodes
  const tier2Y = 185;
  const childCount = childNodes.length;
  const childSpacing = (width - 160) / Math.max(1, childCount - 1 || 1);

  childNodes.forEach((child, i) => {
    const childX = childCount === 1 ? width / 2 : 80 + i * childSpacing;

    elements.push(`
      <!-- Tree Branch Line -->
      <path d="M ${rootX} ${rootY + 45} L ${childX} ${tier2Y}" stroke="${BRAND.slate}" stroke-width="2" />
      <g transform="translate(${childX - 80}, ${tier2Y})">
        <rect width="160" height="40" rx="6" fill="#1E293B" stroke="${BRAND.teal}" stroke-width="1.5" />
        <text x="80" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#FFFFFF" text-anchor="middle">${escapeXml(child.label)}</text>
      </g>
    `);
  });

  // Tier 3 Leaf Nodes (if present)
  if (leafNodes.length > 0) {
    const tier3Y = 270;
    const leafCount = leafNodes.length;
    const leafSpacing = (width - 200) / Math.max(1, leafCount - 1 || 1);

    leafNodes.forEach((leaf, j) => {
      const leafX = leafCount === 1 ? width / 2 : 100 + j * leafSpacing;
      const parentX = childNodes.length > 0 ? (80 + (j % childNodes.length) * childSpacing) : rootX;

      elements.push(`
        <path d="M ${parentX} ${tier2Y + 40} L ${leafX} ${tier3Y}" stroke="${BRAND.cardBorder}" stroke-width="1.5" stroke-dasharray="3,3" />
        <g transform="translate(${leafX - 65}, ${tier3Y})">
          <rect width="130" height="32" rx="4" fill="#0F172A" stroke="${BRAND.gold}" stroke-width="1" />
          <text x="65" y="20" font-family="system-ui, sans-serif" font-size="11" fill="${BRAND.textPrimary}" text-anchor="middle">${escapeXml(leaf.label)}</text>
        </g>
      `);
    });
  }

  return elements.join("\n");
}

// ---------------------------------------------------------------------------
// Master Structured Spec Renderer
// ---------------------------------------------------------------------------

/**
 * Render a complete, standalone, accessible SVG string from a VisualSpecification.
 */
export function renderVisualSpecificationToSvg(
  spec: VisualSpecification,
  options?: { width?: number; height?: number; slideNo?: number }
): string {
  const width = options?.width || 800;
  const height = options?.height || 450;
  const slideNo = options?.slideNo || 1;
  const id = spec.id || `spec-${slideNo}`;

  let familyContent = "";
  switch (spec.visualFamily) {
    case "PROCESS":
      familyContent = renderProcessFamilySvg(spec, width, height, id);
      break;
    case "SYSTEM_ARCHITECTURE":
      familyContent = renderSystemArchitectureFamilySvg(spec, width, height, id);
      break;
    case "DATA_FLOW":
      familyContent = renderDataFlowFamilySvg(spec, width, height, id);
      break;
    case "COMPARISON_MATRIX":
      familyContent = renderComparisonMatrixFamilySvg(spec, width, height);
      break;
    case "CAUSE_EFFECT":
      familyContent = renderCauseEffectFamilySvg(spec, width, height, id);
      break;
    case "QUANTITATIVE":
      familyContent = renderQuantitativeFamilySvg(spec, width, height, id);
      break;
    case "HIERARCHY":
      familyContent = renderHierarchyFamilySvg(spec, width, height, id);
      break;
    default:
      familyContent = renderProcessFamilySvg(spec, width, height, id);
      break;
  }

  const focusQuestion = spec.studentFocusQuestion ? escapeXml(spec.studentFocusQuestion) : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="vis-title-${id} vis-desc-${id}">
  <title id="vis-title-${id}">${escapeXml(spec.title)} (${spec.visualFamily})</title>
  <desc id="vis-desc-${id}">${escapeXml(spec.description)}</desc>
  
  <!-- Canvas Background -->
  <rect width="100%" height="100%" fill="${BRAND.darkBg}" rx="10" />
  
  <!-- Header Bar -->
  <g class="header-bar" transform="translate(30, 24)">
    <rect width="120" height="22" rx="4" fill="${BRAND.primary}" opacity="0.9" />
    <text x="60" y="15" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.8">${spec.visualFamily}</text>
    <text x="135" y="16" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="${BRAND.textPrimary}">${escapeXml(spec.title)}</text>
  </g>

  <!-- Core Visual Diagram Canvas -->
  <g class="visual-canvas">
    ${familyContent}
  </g>

  <!-- Footer Focus Question Banner -->
  ${focusQuestion ? `
  <g class="focus-question-bar" transform="translate(30, ${height - 42})">
    <rect width="${width - 60}" height="30" rx="6" fill="#1E293B" stroke="${BRAND.cardBorder}" stroke-width="1" />
    <circle cx="16" cy="15" r="7" fill="${BRAND.gold}" />
    <text x="16" y="19" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#0F172A" text-anchor="middle">?</text>
    <text x="32" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${BRAND.gold}">Focus Question:</text>
    <text x="135" y="19" font-family="system-ui, sans-serif" font-size="11" fill="${BRAND.textPrimary}">${focusQuestion.length > 85 ? focusQuestion.slice(0, 85) + "..." : focusQuestion}</text>
  </g>` : ""}
</svg>`.trim();
}

// ---------------------------------------------------------------------------
// Legacy 7 Intent Renderers (Backward Compatibility)
// ---------------------------------------------------------------------------

function renderHubSpoke(nodes: string[], slideNo: number, width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const hubR = 40;
  const satR = 24;
  const orbit = Math.min(width, height) * 0.38;
  const hubLabel = nodes[0] ?? "Hub";
  const satellites = nodes.slice(1, 9);
  const N = satellites.length;

  const spokes: string[] = [];
  const circles: string[] = [];

  for (let i = 0; i < N; i++) {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    const sx = cx + orbit * Math.cos(angle);
    const sy = cy + orbit * Math.sin(angle);
    spokes.push(`<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${sx.toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${BRAND.slate}" stroke-width="1.5" stroke-dasharray="4 2"/>`);
    const fill = NODE_FILLS[i % NODE_FILLS.length];
    circles.push(`
      <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${satR}" fill="${fill}" opacity="0.9"/>
      <text x="${sx.toFixed(1)}" y="${(sy + 4).toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-family="sans-serif">
        ${wrapLabel(satellites[i], sx, sy - 2, 8, 12)}
      </text>`);
  }

  const inner = `
  <rect width="${width}" height="${height}" fill="#F8FAFC" rx="10"/>
  ${spokes.join("\n  ")}
  <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="${BRAND.primary}"/>
  <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="bold" font-family="sans-serif">
    ${wrapLabel(hubLabel, cx, cy - 4, 10, 14)}
  </text>
  ${circles.join("\n  ")}`;

  return svgWrap(slideNo, "HUB_SPOKE", width, height, inner);
}

function renderLayerStack(nodes: string[], slideNo: number, width: number, height: number): string {
  const safeNodes = nodes.slice(0, 6);
  const N = Math.max(safeNodes.length, 1);
  const padX = 40;
  const padY = 24;
  const gap = 8;
  const layerW = width - padX * 2;
  const layerH = (height - padY * 2 - gap * (N - 1)) / N;

  const rects: string[] = safeNodes.map((label, i) => {
    const y = padY + i * (layerH + gap);
    const fill = NODE_FILLS[i % NODE_FILLS.length];
    const textY = y + layerH / 2 + 4;
    return `
    <rect x="${padX}" y="${y.toFixed(1)}" width="${layerW}" height="${layerH.toFixed(1)}" rx="6" fill="${fill}" opacity="0.88"/>
    <text x="${width / 2}" y="${textY.toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="600" font-family="sans-serif">
      ${wrapLabel(label, width / 2, textY - 4, 30, 14)}
    </text>`;
  });

  const inner = `
  <rect width="${width}" height="${height}" fill="#F8FAFC" rx="10"/>
  ${rects.join("\n  ")}`;

  return svgWrap(slideNo, "LAYER_STACK", width, height, inner);
}

function renderChain(nodes: string[], slideNo: number, width: number, height: number): string {
  const safeNodes = nodes.slice(0, 5);
  const N = Math.max(safeNodes.length, 1);
  const cy = height / 2;
  const padX = 36;
  const usableW = width - padX * 2;
  const r = Math.min(32, usableW / (N * 2.8));
  const step = N > 1 ? (usableW - r * 2) / (N - 1) : 0;

  const lines: string[] = [];
  const circles: string[] = [];

  for (let i = 0; i < N; i++) {
    const cx = N === 1 ? width / 2 : padX + r + i * step;
    if (i < N - 1) {
      const nextCx = padX + r + (i + 1) * step;
      lines.push(`<line x1="${(cx + r).toFixed(1)}" y1="${cy}" x2="${(nextCx - r).toFixed(1)}" y2="${cy}" stroke="${BRAND.primary}" stroke-width="2"/>
  <polygon points="${(nextCx - r).toFixed(1)},${cy} ${(nextCx - r - 8).toFixed(1)},${cy - 5} ${(nextCx - r - 8).toFixed(1)},${cy + 5}" fill="${BRAND.primary}"/>`);
    }
    const fill = NODE_FILLS[i % NODE_FILLS.length];
    circles.push(`
    <circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r.toFixed(1)}" fill="${fill}"/>
    <text x="${cx.toFixed(1)}" y="${cy + 4}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="600" font-family="sans-serif">
      ${wrapLabel(safeNodes[i], cx, cy - 2, 7, 12)}
    </text>`);
  }

  const inner = `
  <rect width="${width}" height="${height}" fill="#F8FAFC" rx="10"/>
  ${lines.join("\n  ")}
  ${circles.join("\n  ")}`;

  return svgWrap(slideNo, "CHAIN", width, height, inner);
}

function renderVenn(nodes: string[], slideNo: number, width: number, height: number): string {
  const cy = height / 2;
  const r = Math.min(width, height) * 0.32;
  const offset = r * 0.55;
  const cxLeft = width / 2 - offset;
  const cxRight = width / 2 + offset;
  const labelLeft = nodes[0] ?? "Set A";
  const labelRight = nodes[1] ?? "Set B";
  const labelIntersect = nodes[2] ?? "Overlap";

  const inner = `
  <rect width="${width}" height="${height}" fill="#F8FAFC" rx="10"/>
  <circle cx="${cxLeft.toFixed(1)}" cy="${cy}" r="${r.toFixed(1)}" fill="${BRAND.teal}" fill-opacity="0.5" stroke="${BRAND.teal}" stroke-width="2"/>
  <circle cx="${cxRight.toFixed(1)}" cy="${cy}" r="${r.toFixed(1)}" fill="${BRAND.gold}" fill-opacity="0.5" stroke="${BRAND.gold}" stroke-width="2"/>
  <text x="${(cxLeft - r * 0.3).toFixed(1)}" y="${cy + 4}" text-anchor="middle" fill="${BRAND.teal}" font-size="13" font-weight="bold" font-family="sans-serif">${wrapLabel(labelLeft, cxLeft - r * 0.3, cy - 2, 12, 14)}</text>
  <text x="${(cxRight + r * 0.3).toFixed(1)}" y="${cy + 4}" text-anchor="middle" fill="#B45309" font-size="13" font-weight="bold" font-family="sans-serif">${wrapLabel(labelRight, cxRight + r * 0.3, cy - 2, 12, 14)}</text>
  <text x="${(width / 2).toFixed(1)}" y="${cy + 4}" text-anchor="middle" fill="${BRAND.primary}" font-size="12" font-weight="600" font-family="sans-serif">${wrapLabel(labelIntersect, width / 2, cy - 2, 8, 13)}</text>`;

  return svgWrap(slideNo, "VENN", width, height, inner);
}

function renderFunnel(nodes: string[], slideNo: number, width: number, height: number): string {
  const safeNodes = nodes.slice(0, 5);
  const N = Math.max(safeNodes.length, 1);
  const padX = 30;
  const padY = 20;
  const maxTopW = width - padX * 2;
  const minBotW = maxTopW * 0.25;
  const stageH = (height - padY * 2) / N;

  const elements: string[] = [];

  for (let i = 0; i < N; i++) {
    const topFraction = i / N;
    const botFraction = (i + 1) / N;
    const topW = maxTopW - (maxTopW - minBotW) * topFraction;
    const botW = maxTopW - (maxTopW - minBotW) * botFraction;
    const yTop = padY + i * stageH;
    const yBot = padY + (i + 1) * stageH;
    const xTopL = (width - topW) / 2;
    const xTopR = xTopL + topW;
    const xBotL = (width - botW) / 2;
    const xBotR = xBotL + botW;

    const fill = NODE_FILLS[i % NODE_FILLS.length];
    const midY = (yTop + yBot) / 2 + 4;
    const pts = `${xTopL.toFixed(1)},${yTop.toFixed(1)} ${xTopR.toFixed(1)},${yTop.toFixed(1)} ${xBotR.toFixed(1)},${yBot.toFixed(1)} ${xBotL.toFixed(1)},${yBot.toFixed(1)}`;

    elements.push(`
    <polygon points="${pts}" fill="${fill}" opacity="0.88" stroke="#FFFFFF" stroke-width="1.5"/>
    <text x="${(width / 2).toFixed(1)}" y="${midY.toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="600" font-family="sans-serif">
      ${wrapLabel(safeNodes[i], width / 2, midY - 4, 24, 14)}
    </text>`);
  }

  const inner = `
  <rect width="${width}" height="${height}" fill="#F8FAFC" rx="10"/>
  ${elements.join("\n  ")}`;

  return svgWrap(slideNo, "FUNNEL", width, height, inner);
}

function renderMatrix(nodes: string[], slideNo: number, width: number, height: number): string {
  const pad = 24;
  const cellW = (width - pad * 3) / 2;
  const cellH = (height - pad * 3) / 2;
  const safeNodes = [nodes[0] ?? "Q1", nodes[1] ?? "Q2", nodes[2] ?? "Q3", nodes[3] ?? "Q4"];

  const quads = [
    { x: pad, y: pad, fill: BRAND.teal, label: safeNodes[0] },
    { x: pad * 2 + cellW, y: pad, fill: BRAND.cyan, label: safeNodes[1] },
    { x: pad, y: pad * 2 + cellH, fill: BRAND.gold, label: safeNodes[2] },
    { x: pad * 2 + cellW, y: pad * 2 + cellH, fill: BRAND.primary, label: safeNodes[3] },
  ];

  const rects = quads.map((q) => {
    const textX = q.x + cellW / 2;
    const textY = q.y + cellH / 2 + 4;
    return `
    <rect x="${q.x.toFixed(1)}" y="${q.y.toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" rx="8" fill="${q.fill}" opacity="0.88"/>
    <text x="${textX.toFixed(1)}" y="${textY.toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="600" font-family="sans-serif">
      ${wrapLabel(q.label, textX, textY - 4, 14, 15)}
    </text>`;
  });

  const inner = `
  <rect width="${width}" height="${height}" fill="#F8FAFC" rx="10"/>
  ${rects.join("\n  ")}`;

  return svgWrap(slideNo, "MATRIX", width, height, inner);
}

function renderTimeline(nodes: string[], slideNo: number, width: number, height: number): string {
  const safeNodes = nodes.slice(0, 5);
  const N = Math.max(safeNodes.length, 1);
  const padX = 40;
  const cy = height / 2;
  const spineStart = padX;
  const spineEnd = width - padX;
  const step = N > 1 ? (spineEnd - spineStart) / (N - 1) : 0;
  const elements: string[] = [];

  elements.push(`<line x1="${spineStart}" y1="${cy}" x2="${spineEnd}" y2="${cy}" stroke="${BRAND.slate}" stroke-width="3"/>`);

  for (let i = 0; i < N; i++) {
    const cx = N === 1 ? width / 2 : spineStart + i * step;
    const isAbove = i % 2 === 0;
    const markerR = 7;
    const fill = NODE_FILLS[i % NODE_FILLS.length];
    const textY = isAbove ? cy - markerR - 10 : cy + markerR + 18;

    elements.push(`
    <circle cx="${cx.toFixed(1)}" cy="${cy}" r="${markerR}" fill="${fill}" stroke="#FFFFFF" stroke-width="2"/>
    <text x="${cx.toFixed(1)}" y="${textY.toFixed(1)}" text-anchor="middle" fill="${BRAND.slate}" font-size="11" font-weight="600" font-family="sans-serif">
      ${wrapLabel(safeNodes[i], cx, textY - 4, 10, 13)}
    </text>`);
  }

  elements.push(
    `<polygon points="${spineEnd.toFixed(1)},${cy.toFixed(1)} ${(spineEnd - 10).toFixed(1)},${(cy - 5).toFixed(1)} ${(spineEnd - 10).toFixed(1)},${(cy + 5).toFixed(1)}" fill="${BRAND.slate}"/>`
  );

  const inner = `
  <rect width="${width}" height="${height}" fill="#F8FAFC" rx="10"/>
  ${elements.join("\n  ")}`;

  return svgWrap(slideNo, "TIMELINE", width, height, inner);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Render a structured SVG diagram string for a given `visualIntent`.
 * Supports both the 7 canonical visual families and the 7 legacy template intents.
 */
export function renderSvgDiagram(
  visualIntent: string | null | undefined,
  nodes: string[] = [],
  slideNo: number = 0,
  width: number = 560,
  height: number = 340
): string | null {
  if (!visualIntent || !SUPPORTED_INTENTS.has(visualIntent)) {
    return null;
  }

  const safeNodes = nodes.filter((n) => typeof n === "string" && n.trim().length > 0);

  // Canonical 7 Visual Families
  if (
    visualIntent === "PROCESS" ||
    visualIntent === "SYSTEM_ARCHITECTURE" ||
    visualIntent === "DATA_FLOW" ||
    visualIntent === "COMPARISON_MATRIX" ||
    visualIntent === "CAUSE_EFFECT" ||
    visualIntent === "QUANTITATIVE" ||
    visualIntent === "HIERARCHY"
  ) {
    const spec: VisualSpecification = {
      id: `vis-${slideNo || 1}`,
      visualFamily: visualIntent as VisualFamily,
      title: `${visualIntent} Diagram`,
      description: `Instructional visual representation for slide ${slideNo}`,
      layout: { type: visualIntent, direction: "LR" },
      nodes: safeNodes.map((label, idx) => ({
        id: `node-${idx + 1}`,
        label,
        description: `Stage ${idx + 1}`,
      })),
      connections: safeNodes.slice(0, -1).map((_, idx) => ({
        from: `node-${idx + 1}`,
        to: `node-${idx + 2}`,
        label: "transitions",
      })),
      studentFocusQuestion: `How does each stage in this ${visualIntent} preserve system invariants?`,
      pedagogicalRationale: `Visualizing as a ${visualIntent} clarifies operational dynamics and dependencies.`,
    };
    return renderVisualSpecificationToSvg(spec, { width, height, slideNo });
  }

  // Legacy template intents
  switch (visualIntent as VisualIntent) {
    case "HUB_SPOKE":
      return renderHubSpoke(safeNodes, slideNo, width, height);
    case "LAYER_STACK":
      return renderLayerStack(safeNodes, slideNo, width, height);
    case "CHAIN":
      return renderChain(safeNodes, slideNo, width, height);
    case "VENN":
      return renderVenn(safeNodes, slideNo, width, height);
    case "FUNNEL":
      return renderFunnel(safeNodes, slideNo, width, height);
    case "MATRIX":
      return renderMatrix(safeNodes, slideNo, width, height);
    case "TIMELINE":
      return renderTimeline(safeNodes, slideNo, width, height);
    default:
      return null;
  }
}
