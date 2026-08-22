/**
 * Physics & Mathematics Visual Renderer
 * ===========================================================================
 * Generates SVG diagrams for:
 *   1. Free body diagrams (forces, vectors, equilibrium)
 *   2. Coordinate planes with graphs (functions, curves)
 *   3. Number lines (intervals, inequalities)
 *   4. Circuit diagrams (series, parallel, components)
 *   5. Wave functions (sine, cosine, standing waves)
 *   6. Step-by-step formula derivations
 *   7. Vector diagrams (addition, decomposition)
 *   8. Energy diagrams (potential wells, barriers)
 *   9. Phase diagrams (P-T, P-V)
 *  10. Probability distributions
 *
 * All rendering is programmatic SVG — no external dependencies.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PhysicsVisual {
  svg: string;
  title: string;
  caption: string;
  type: "freebody" | "graph" | "numberline" | "circuit" | "wave" | "formula" | "vector" | "energy" | "phase" | "probability";
}

// ─── Free Body Diagram ──────────────────────────────────────────────────────

export interface Force {
  label: string;
  magnitude: number; // 0-1, relative
  angle: number; // degrees from positive x-axis
  color?: string;
}

export function renderFreeBodyDiagram(
  forces: Force[],
  options: { width?: number; height?: number; title?: string } = {}
): PhysicsVisual {
  const { width = 400, height = 400, title = "Free Body Diagram" } = options;
  const cx = width / 2;
  const cy = height / 2;
  const maxForceLen = Math.min(width, height) * 0.35;

  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"];

  const forcesSvg = forces.map((f, i) => {
    const color = f.color || colors[i % colors.length];
    const angleRad = (f.angle * Math.PI) / 180;
    const len = f.magnitude * maxForceLen;
    const endX = cx + Math.cos(angleRad) * len;
    const endY = cy - Math.sin(angleRad) * len; // SVG y is inverted

    // Arrow shaft
    const shaft = `<line x1="${cx}" y1="${cy}" x2="${endX}" y2="${endY}" 
                   stroke="${color}" stroke-width="3" marker-end="url(#fbdArrow)"/>`;

    // Label
    const labelX = cx + Math.cos(angleRad) * (len * 0.6);
    const labelY = cy - Math.sin(angleRad) * (len * 0.6);
    const label = `<text x="${labelX}" y="${labelY}" 
                    text-anchor="middle" font-size="13" fill="${color}" font-weight="bold"
                    dx="${Math.cos(angleRad) * 15}" dy="${-Math.sin(angleRad) * 10}">
                    ${escapeXml(f.label)}
                   </text>`;

    return `${shaft}\n${label}`;
  }).join("\n");

  // Object (circle at center)
  const object = `<circle cx="${cx}" cy="${cy}" r="20" fill="#ecf0f1" stroke="#333" stroke-width="2"/>`;

  // Grid lines (subtle)
  const grid = `
    <line x1="${cx}" y1="0" x2="${cx}" y2="${height}" stroke="#eee" stroke-width="1" stroke-dasharray="4"/>
    <line x1="0" y1="${cy}" x2="${width}" y2="${cy}" stroke="#eee" stroke-width="1" stroke-dasharray="4"/>
  `;

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      <defs>
        <marker id="fbdArrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor"/>
        </marker>
      </defs>
      ${grid}
      ${object}
      ${forcesSvg}
      <text x="${cx}" y="${height - 15}" text-anchor="middle" font-size="11" fill="#999">${escapeXml(title)}</text>
    </svg>`,
    title,
    caption: forces.map((f) => `${f.label} (${f.magnitude.toFixed(1)})`).join(", "),
    type: "freebody",
  };
}

// ─── Coordinate Plane / Graph ───────────────────────────────────────────────

export interface GraphData {
  points?: Array<{ x: number; y: number }>;
  functionStr?: string; // LaTeX function like "x^2" or "sin(x)"
  domain?: [number, number];
  color?: string;
  label?: string;
}

export function renderGraph(
  data: GraphData[],
  options: { width?: number; height?: number; xRange?: [number, number]; yRange?: [number, number]; title?: string } = {}
): PhysicsVisual {
  const { width = 500, height = 400, xRange = [-5, 5], yRange = [-5, 5], title = "Graph" } = options;
  const padding = 50;
  const plotW = width - 2 * padding;
  const plotH = height - 2 * padding;

  const toSvgX = (x: number) => padding + ((x - xRange[0]) / (xRange[1] - xRange[0])) * plotW;
  const toSvgY = (y: number) => padding + plotH - ((y - yRange[0]) / (yRange[1] - yRange[0])) * plotH;

  // Axes
  const xAxisY = toSvgY(0);
  const yAxisX = toSvgX(0);
  const axes = `
    <line x1="${padding}" y1="${xAxisY}" x2="${width - padding}" y2="${xAxisY}" stroke="#333" stroke-width="1.5"/>
    <line x1="${yAxisX}" y1="${padding}" x2="${yAxisX}" y2="${height - padding}" stroke="#333" stroke-width="1.5"/>
    <polygon points="${width - padding - 5},${xAxisY - 4} ${width - padding},${xAxisY} ${width - padding - 5},${xAxisY + 4}" fill="#333"/>
    <polygon points="${yAxisX - 4},${padding + 5} ${yAxisX},${padding} ${yAxisX + 4},${padding + 5}" fill="#333"/>
    <text x="${width - padding + 5}" y="${xAxisY + 4}" font-size="12" fill="#333">x</text>
    <text x="${yAxisX + 5}" y="${padding - 5}" font-size="12" fill="#333">y</text>
  `;

  // Tick marks
  const ticks = [];
  for (let x = Math.ceil(xRange[0]); x <= Math.floor(xRange[1]); x++) {
    if (x === 0) continue;
    const sx = toSvgX(x);
    ticks.push(`<line x1="${sx}" y1="${xAxisY - 3}" x2="${sx}" y2="${xAxisY + 3}" stroke="#333" stroke-width="1"/>`);
    ticks.push(`<text x="${sx}" y="${xAxisY + 15}" text-anchor="middle" font-size="10" fill="#666">${x}</text>`);
  }
  for (let y = Math.ceil(yRange[0]); y <= Math.floor(yRange[1]); y++) {
    if (y === 0) continue;
    const sy = toSvgY(y);
    ticks.push(`<line x1="${yAxisX - 3}" y1="${sy}" x2="${yAxisX + 3}" y2="${sy}" stroke="#333" stroke-width="1"/>`);
    ticks.push(`<text x="${yAxisX - 8}" y="${sy + 4}" text-anchor="end" font-size="10" fill="#666">${y}</text>`);
  }

  // Plot data series
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];
  const seriesSvg = data.map((series, i) => {
    const color = series.color || colors[i % colors.length];

    if (series.points && series.points.length > 0) {
      // Scatter plot or line plot
      const pathData = series.points
        .map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`)
        .join(" ");
      return `
        <polyline points="${pathData}" fill="none" stroke="${color}" stroke-width="2"/>
        ${series.points.map((p) => `<circle cx="${toSvgX(p.x)}" cy="${toSvgY(p.y)}" r="3" fill="${color}"/>`).join("\n")}
        ${series.label ? `<text x="${width - padding - 10}" y="${padding + 15 + i * 18}" text-anchor="end" font-size="11" fill="${color}" font-weight="bold">${escapeXml(series.label)}</text>` : ""}
      `;
    }

    return "";
  }).join("\n");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      ${axes}
      ${ticks.join("\n")}
      ${seriesSvg}
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#999">${escapeXml(title)}</text>
    </svg>`,
    title,
    caption: data.map((s) => s.label || "series").join(", "),
    type: "graph",
  };
}

// ─── Number Line ────────────────────────────────────────────────────────────

export function renderNumberLine(
  intervals: Array<{ start: number; end: number; color?: string; label?: string; open?: boolean }>,
  options: { width?: number; height?: number; min?: number; max?: number; title?: string } = {}
): PhysicsVisual {
  const { width = 500, height = 120, min = -5, max = 5, title = "Number Line" } = options;
  const padding = 40;
  const lineY = height / 2;
  const lineLen = width - 2 * padding;

  const toX = (val: number) => padding + ((val - min) / (max - min)) * lineLen;

  // Main line
  const mainLine = `<line x1="${padding}" y1="${lineY}" x2="${width - padding}" y2="${lineY}" stroke="#333" stroke-width="2"/>`;

  // Ticks
  const ticks = [];
  for (let v = Math.ceil(min); v <= Math.floor(max); v++) {
    const x = toX(v);
    ticks.push(`<line x1="${x}" y1="${lineY - 5}" x2="${x}" y2="${lineY + 5}" stroke="#333" stroke-width="1"/>`);
    ticks.push(`<text x="${x}" y="${lineY + 20}" text-anchor="middle" font-size="11" fill="#666">${v}</text>`);
  }

  // Intervals
  const intervalSvg = intervals.map((int, i) => {
    const color = int.color || "#3498db";
    const x1 = toX(int.start);
    const x2 = toX(int.end);
    const barY = lineY - 15 - i * 8;
    const open1 = int.open ? "○" : "●";
    const open2 = int.open ? "○" : "●";

    return `
      <line x1="${x1}" y1="${barY}" x2="${x2}" y2="${barY}" stroke="${color}" stroke-width="4"/>
      <circle cx="${x1}" cy="${barY}" r="4" fill="${int.open ? 'white' : color}" stroke="${color}" stroke-width="2"/>
      <circle cx="${x2}" cy="${barY}" r="4" fill="${int.open ? 'white' : color}" stroke="${color}" stroke-width="2"/>
      ${int.label ? `<text x="${(x1 + x2) / 2}" y="${barY - 8}" text-anchor="middle" font-size="10" fill="${color}" font-weight="bold">${escapeXml(int.label)}</text>` : ""}
    `;
  }).join("\n");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      ${mainLine}
      ${ticks.join("\n")}
      ${intervalSvg}
    </svg>`,
    title,
    caption: intervals.map((i) => `${i.open ? "(" : "["}${i.start}, ${i.end}${i.open ? ")" : "]"}`).join(" ∪ "),
    type: "numberline",
  };
}

// ─── Wave Function ──────────────────────────────────────────────────────────

export function renderWave(
  waves: Array<{ amplitude: number; frequency: number; phase?: number; color?: string; label?: string }>,
  options: { width?: number; height?: number; title?: string } = {}
): PhysicsVisual {
  const { width = 500, height = 200, title = "Wave Function" } = options;
  const padding = 40;
  const plotW = width - 2 * padding;
  const plotH = height - 2 * padding;
  const centerY = height / 2;

  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"];

  // Axis
  const axis = `
    <line x1="${padding}" y1="${centerY}" x2="${width - padding}" y2="${centerY}" stroke="#ccc" stroke-width="1"/>
    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="1.5"/>
  `;

  const wavesSvg = waves.map((w, i) => {
    const color = w.color || colors[i % colors.length];
    const phase = w.phase || 0;
    const points: string[] = [];

    for (let px = 0; px <= plotW; px += 2) {
      const x = (px / plotW) * 4 * Math.PI; // 2 full cycles
      const y = w.amplitude * Math.sin(w.frequency * x + phase);
      const svgX = padding + px;
      const svgY = centerY - (y / (w.amplitude || 1)) * (plotH / 2.5);
      points.push(`${svgX},${svgY}`);
    }

    return `
      <polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="2"/>
      ${w.label ? `<text x="${width - padding - 5}" y="${padding + 15 + i * 18}" text-anchor="end" font-size="11" fill="${color}" font-weight="bold">${escapeXml(w.label)}</text>` : ""}
    `;
  }).join("\n");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      ${axis}
      ${wavesSvg}
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#999">${escapeXml(title)}</text>
    </svg>`,
    title,
    caption: waves.map((w) => `A=${w.amplitude}, f=${w.frequency}`).join("; "),
    type: "wave",
  };
}

// ─── Step-by-Step Formula Derivation ────────────────────────────────────────

export function renderFormulaDerivation(
  steps: Array<{ label: string; formula: string; explanation: string }>,
  options: { width?: number; height?: number } = {}
): PhysicsVisual {
  const { width = 600, height = 0 } = options; // height is auto-calculated
  const stepHeight = 80;
  const calcHeight = Math.max(height, steps.length * stepHeight + 60);
  const padding = 30;
  const formulaX = width * 0.5;
  const labelX = padding;
  const explainX = width - padding;

  const stepsSvg = steps.map((step, i) => {
    const y = padding + 20 + i * stepHeight;
    return `
      <g>
        ${i > 0 ? `<line x1="${formulaX}" y1="${y - stepHeight + 20}" x2="${formulaX}" y2="${y - 5}" stroke="#3498db" stroke-width="1.5" marker-end="url(#derivationArrow)"/>` : ""}
        <text x="${labelX}" y="${y + 5}" font-size="12" fill="#666" font-weight="bold">${escapeXml(step.label)}</text>
        <text x="${formulaX}" y="${y + 5}" text-anchor="middle" font-size="16" fill="#1a1a1a" font-family="serif" font-style="italic">${escapeXml(step.formula)}</text>
        <text x="${explainX}" y="${y + 5}" text-anchor="end" font-size="10" fill="#999" font-style="italic">${escapeXml(step.explanation)}</text>
      </g>
    `;
  }).join("\n");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${calcHeight}" width="${width}" height="${calcHeight}">
      <rect width="100%" height="100%" fill="white"/>
      <defs>
        <marker id="derivationArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3498db"/>
        </marker>
      </defs>
      ${stepsSvg}
    </svg>`,
    title: `${steps[0]?.label || ""} → ${steps[steps.length - 1]?.label || ""}`,
    caption: `${steps.length}-step derivation`,
    type: "formula",
  };
}

// ─── Vector Diagram ─────────────────────────────────────────────────────────

export function renderVectorDiagram(
  vectors: Array<{ label: string; dx: number; dy: number; color?: string }>,
  options: { width?: number; height?: number; title?: string; showResultant?: boolean } = {}
): PhysicsVisual {
  const { width = 400, height = 400, title = "Vector Addition", showResultant = true } = options;
  const cx = width / 2;
  const cy = height / 2;
  const scale = 50; // pixels per unit

  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];

  // Draw vectors tip-to-tail
  let currentX = cx;
  let currentY = cy;
  let totalDx = 0;
  let totalDy = 0;

  const vectorsSvg = vectors.map((v, i) => {
    const color = v.color || colors[i % colors.length];
    const startX = currentX;
    const startY = currentY;
    currentX += v.dx * scale;
    currentY -= v.dy * scale; // SVG y is inverted
    totalDx += v.dx;
    totalDy += v.dy;

    const angle = Math.atan2(-(v.dy), v.dx);
    const labelX = (startX + currentX) / 2 + Math.cos(angle + Math.PI / 2) * 15;
    const labelY = (startY + currentY) / 2 + Math.sin(angle + Math.PI / 2) * 15;

    return `
      <line x1="${startX}" y1="${startY}" x2="${currentX}" y2="${currentY}" 
            stroke="${color}" stroke-width="3" marker-end="url(#vectorArrow-${i})"/>
      <defs>
        <marker id="vectorArrow-${i}" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="${color}"/>
        </marker>
      </defs>
      <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="12" fill="${color}" font-weight="bold">
        ${escapeXml(v.label)}
      </text>
    `;
  }).join("\n");

  // Resultant vector
  const resultantSvg = showResultant ? `
    <line x1="${cx}" y1="${cy}" x2="${cx + totalDx * scale}" y2="${cy - totalDy * scale}" 
          stroke="#333" stroke-width="2" stroke-dasharray="6" marker-end="url(#resultantArrow)"/>
    <defs>
      <marker id="resultantArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#333"/>
      </marker>
    </defs>
    <text x="${cx + totalDx * scale / 2 + 15}" y="${cy - totalDy * scale / 2 - 10}" 
          font-size="12" fill="#333" font-weight="bold">
      R = (${totalDx.toFixed(1)}, ${totalDy.toFixed(1)})
    </text>
  ` : "";

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      <circle cx="${cx}" cy="${cy}" r="3" fill="#333"/>
      ${vectorsSvg}
      ${resultantSvg}
      <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="11" fill="#999">${escapeXml(title)}</text>
    </svg>`,
    title,
    caption: vectors.map((v) => `${v.label}=(${v.dx},${v.dy})`).join(", ") + (showResultant ? ` → R=(${totalDx.toFixed(1)},${totalDy.toFixed(1)})` : ""),
    type: "vector",
  };
}

// ─── Simple Circuit Diagram ─────────────────────────────────────────────────

export function renderCircuit(
  components: Array<{ type: "resistor" | "battery" | "capacitor" | "inductor" | "switch"; label: string; value?: string }>,
  options: { width?: number; height?: number; title?: string; parallel?: boolean } = {}
): PhysicsVisual {
  const { width = 500, height = 200, title = "Circuit Diagram", parallel = false } = options;
  const padding = 40;
  const centerY = height / 2;
  const compWidth = (width - 2 * padding) / components.length;

  const componentsSvg = components.map((comp, i) => {
    const x = padding + i * compWidth;
    const cx = x + compWidth / 2;

    switch (comp.type) {
      case "resistor":
        return `
          <line x1="${x}" y1="${centerY}" x2="${cx - 15}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <rect x="${cx - 15}" y="${centerY - 8}" width="30" height="16" fill="none" stroke="#333" stroke-width="2"/>
          <line x1="${cx + 15}" y1="${centerY}" x2="${x + compWidth}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <text x="${cx}" y="${centerY - 15}" text-anchor="middle" font-size="10" fill="#666">${escapeXml(comp.label)}</text>
          ${comp.value ? `<text x="${cx}" y="${centerY + 25}" text-anchor="middle" font-size="9" fill="#999">${escapeXml(comp.value)}</text>` : ""}
        `;
      case "battery":
        return `
          <line x1="${x}" y1="${centerY}" x2="${cx - 8}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <line x1="${cx - 8}" y1="${centerY - 12}" x2="${cx - 8}" y2="${centerY + 12}" stroke="#333" stroke-width="3"/>
          <line x1="${cx - 2}" y1="${centerY - 7}" x2="${cx - 2}" y2="${centerY + 7}" stroke="#333" stroke-width="1.5"/>
          <line x1="${cx + 4}" y1="${centerY - 12}" x2="${cx + 4}" y2="${centerY + 12}" stroke="#333" stroke-width="3"/>
          <line x1="${cx + 10}" y1="${centerY - 7}" x2="${cx + 10}" y2="${centerY + 7}" stroke="#333" stroke-width="1.5"/>
          <line x1="${cx + 10}" y1="${centerY}" x2="${x + compWidth}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <text x="${cx}" y="${centerY - 18}" text-anchor="middle" font-size="10" fill="#666">${escapeXml(comp.label)}</text>
          ${comp.value ? `<text x="${cx}" y="${centerY + 28}" text-anchor="middle" font-size="9" fill="#999">${escapeXml(comp.value)}</text>` : ""}
        `;
      case "capacitor":
        return `
          <line x1="${x}" y1="${centerY}" x2="${cx - 5}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <line x1="${cx - 5}" y1="${centerY - 12}" x2="${cx - 5}" y2="${centerY + 12}" stroke="#333" stroke-width="2"/>
          <line x1="${cx + 5}" y1="${centerY - 12}" x2="${cx + 5}" y2="${centerY + 12}" stroke="#333" stroke-width="2"/>
          <line x1="${cx + 5}" y1="${centerY}" x2="${x + compWidth}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <text x="${cx}" y="${centerY - 18}" text-anchor="middle" font-size="10" fill="#666">${escapeXml(comp.label)}</text>
        `;
      case "inductor":
        return `
          <line x1="${x}" y1="${centerY}" x2="${cx - 15}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <path d="M ${cx - 15} ${centerY} Q ${cx - 10} ${centerY - 10} ${cx - 5} ${centerY} Q ${cx} ${centerY - 10} ${cx + 5} ${centerY} Q ${cx + 10} ${centerY - 10} ${cx + 15} ${centerY}" 
                fill="none" stroke="#333" stroke-width="2"/>
          <line x1="${cx + 15}" y1="${centerY}" x2="${x + compWidth}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <text x="${cx}" y="${centerY - 18}" text-anchor="middle" font-size="10" fill="#666">${escapeXml(comp.label)}</text>
        `;
      case "switch":
        return `
          <line x1="${x}" y1="${centerY}" x2="${cx - 10}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <circle cx="${cx - 10}" cy="${centerY}" r="3" fill="#333"/>
          <line x1="${cx - 7}" y1="${centerY}" x2="${cx + 10}" y2="${centerY - 10}" stroke="#333" stroke-width="2"/>
          <circle cx="${cx + 10}" cy="${centerY}" r="3" fill="#333"/>
          <line x1="${cx + 10}" y1="${centerY}" x2="${x + compWidth}" y2="${centerY}" stroke="#333" stroke-width="2"/>
          <text x="${cx}" y="${centerY - 18}" text-anchor="middle" font-size="10" fill="#666">${escapeXml(comp.label)}</text>
        `;
      default:
        return "";
    }
  }).join("\n");

  // Connecting wires (top and bottom for parallel)
  const wiresSvg = parallel ? `
    <line x1="${padding}" y1="${centerY - 30}" x2="${width - padding}" y2="${centerY - 30}" stroke="#333" stroke-width="1.5"/>
    <line x1="${padding}" y1="${centerY + 30}" x2="${width - padding}" y2="${centerY + 30}" stroke="#333" stroke-width="1.5"/>
    <line x1="${padding}" y1="${centerY}" x2="${padding}" y2="${centerY - 30}" stroke="#333" stroke-width="1.5"/>
    <line x1="${padding}" y1="${centerY}" x2="${padding}" y2="${centerY + 30}" stroke="#333" stroke-width="1.5"/>
    <line x1="${width - padding}" y1="${centerY}" x2="${width - padding}" y2="${centerY - 30}" stroke="#333" stroke-width="1.5"/>
    <line x1="${width - padding}" y1="${centerY}" x2="${width - padding}" y2="${centerY + 30}" stroke="#333" stroke-width="1.5"/>
  ` : "";

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      ${wiresSvg}
      ${componentsSvg}
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#999">${escapeXml(title)}</text>
    </svg>`,
    title,
    caption: components.map((c) => `${c.label}${c.value ? ` (${c.value})` : ""}`).join(" + "),
    type: "circuit",
  };
}

// ─── Energy Diagram ─────────────────────────────────────────────────────────

export function renderEnergyDiagram(
  wells: Array<{ x: number; depth: number; label: string; color?: string }>,
  options: { width?: number; height?: number; title?: string } = {}
): PhysicsVisual {
  const { width = 500, height = 250, title = "Energy Diagram" } = options;
  const padding = 40;
  const plotW = width - 2 * padding;
  const plotH = height - 2 * padding;
  const baseY = padding + plotH * 0.2;

  // Energy axis
  const yAxis = `
    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="1.5"/>
    <text x="${padding - 10}" y="${padding + plotH / 2}" text-anchor="middle" font-size="11" fill="#666" transform="rotate(-90, ${padding - 10}, ${padding + plotH / 2})">Energy</text>
  `;

  // Position axis
  const xAxis = `
    <line x1="${padding}" y1="${baseY}" x2="${width - padding}" y2="${baseY}" stroke="#ccc" stroke-width="1"/>
    <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#666">Position</text>
  `;

  // Energy wells (parabolic shapes)
  const wellsSvg = wells.map((w, i) => {
    const color = w.color || ["#3498db", "#e74c3c", "#2ecc71"][i % 3];
    const cx = padding + (w.x / 10) * plotW;
    const wellDepth = w.depth * plotH * 0.6;
    const wellWidth = 40;

    // Draw a parabolic well
    const path = `M ${cx - wellWidth} ${baseY} Q ${cx} ${baseY + wellDepth} ${cx + wellWidth} ${baseY}`;

    return `
      <path d="${path}" fill="${color}" opacity="0.15" stroke="${color}" stroke-width="2"/>
      <text x="${cx}" y="${baseY + wellDepth + 15}" text-anchor="middle" font-size="10" fill="${color}" font-weight="bold">
        ${escapeXml(w.label)}
      </text>
    `;
  }).join("\n");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      ${yAxis}
      ${xAxis}
      ${wellsSvg}
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#999">${escapeXml(title)}</text>
    </svg>`,
    title,
    caption: wells.map((w) => `${w.label} (depth=${w.depth})`).join(", "),
    type: "energy",
  };
}

// ─── Probability Distribution ───────────────────────────────────────────────

export function renderDistribution(
  type: "normal" | "uniform" | "exponential" | "binomial",
  params: Record<string, number>,
  options: { width?: number; height?: number; title?: string; color?: string } = {}
): PhysicsVisual {
  const { width = 500, height = 250, title = "Probability Distribution", color = "#3498db" } = options;
  const padding = 40;
  const plotW = width - 2 * padding;
  const plotH = height - 2 * padding;

  let points: Array<{ x: number; y: number }> = [];

  if (type === "normal") {
    const mu = params.mu || 0;
    const sigma = params.sigma || 1;
    for (let i = 0; i <= plotW; i += 2) {
      const x = (i / plotW) * 6 * sigma - 3 * sigma + mu;
      const y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
      points.push({ x: i, y });
    }
  } else if (type === "uniform") {
    const a = params.a || 0;
    const b = params.b || 1;
    const h = 1 / (b - a);
    points = [
      { x: 0, y: 0 },
      { x: ((a - a) / (b - a)) * plotW, y: 0 },
      { x: ((a - a) / (b - a)) * plotW, y: h },
      { x: plotW, y: h },
      { x: plotW, y: 0 },
    ];
  } else if (type === "exponential") {
    const lambda = params.lambda || 1;
    for (let i = 0; i <= plotW; i += 2) {
      const x = (i / plotW) * 5;
      const y = lambda * Math.exp(-lambda * x);
      points.push({ x: i, y });
    }
  }

  // Normalize y to fit plot
  const maxY = Math.max(...points.map((p) => p.y));
  const scaleY = maxY > 0 ? plotH / (maxY * 1.1) : 1;

  const pathData = points
    .map((p) => `${padding + p.x},${padding + plotH - p.y * scaleY}`)
    .join(" ");

  // Fill area under curve
  const fillPath = `M ${padding + points[0].x},${padding + plotH} ${pathData} L ${padding + points[points.length - 1].x},${padding + plotH} Z`;

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      <line x1="${padding}" y1="${padding + plotH}" x2="${width - padding}" y2="${padding + plotH}" stroke="#333" stroke-width="1.5"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + plotH}" stroke="#333" stroke-width="1.5"/>
      <path d="${fillPath}" fill="${color}" opacity="0.15"/>
      <polyline points="${pathData}" fill="none" stroke="${color}" stroke-width="2"/>
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#999">${escapeXml(title)}</text>
    </svg>`,
    title,
    caption: `${type} distribution (${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(", ")})`,
    type: "probability",
  };
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
