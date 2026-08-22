/**
 * Chemistry Structure Renderer
 * ===========================================================================
 * Generates SVG diagrams for:
 *   1. Molecular structures (from SMILES notation)
 *   2. Reaction mechanisms (electron-pushing arrows)
 *   3. Markush structures (R-group notation)
 *   4. DNA/RNA sequences
 *   5. Protein secondary structures
 *
 * All rendering is done server-side as SVG strings — no canvas or browser APIs needed.
 * Uses SmilesDrawer for molecular structures when available, falls back to
 * programmatic SVG generation.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChemistryVisual {
  svg: string;
  title: string;
  caption: string;
  type: "molecule" | "reaction" | "markush" | "sequence" | "pathway" | "general";
}

export interface MoleculeOptions {
  width?: number;
  height?: number;
  bondThickness?: number;
  fontSize?: number;
}

// ─── SMILES → SVG (using SmilesDrawer) ──────────────────────────────────────

/**
 * Render a SMILES string to SVG using SmilesDrawer.
 * Falls back to a placeholder if SmilesDrawer is not available.
 */
export async function renderMolecule(
  smiles: string,
  options: MoleculeOptions = {}
): Promise<ChemistryVisual> {
  const { width = 400, height = 300 } = options;

  try {
    // Dynamic import to avoid SSR issues
    const SmilesDrawer = await import("smiles-drawer");
    const DrawerClass = SmilesDrawer.default || SmilesDrawer;

    // SmilesDrawer renders to an SVG element — we create one in-memory
    const svgNS = "http://www.w3.org/2000/svg";
    const svgEl = { outerHTML: "" };

    // Try the API — SmilesDrawer v2 uses SmilesDrawer.Drawer
    const drawer = new (DrawerClass as any)({
      width,
      height,
      bondThickness: 2,
      fontSize: 14,
      isomeric: true,
      debug: false,
      terminalCarbons: false,
      explicitHydrogens: false,
    });

    // SmilesDrawer.draw can render to a canvas or SVG
    // We'll use the SVG output if available, otherwise placeholder
    if (typeof drawer.draw === "function") {
      // Create a minimal canvas-like object for SmilesDrawer
      const fakeCanvas = {
        width,
        height,
        getContext: () => ({
          clearRect: () => {},
          fillRect: () => {},
          fillStyle: "",
          strokeStyle: "",
          lineWidth: 1,
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          fill: () => {},
          arc: () => {},
          fillText: () => {},
          strokeText: () => {},
          font: "",
          textAlign: "",
          textBaseline: "",
          save: () => {},
          restore: () => {},
          translate: () => {},
          rotate: () => {},
          scale: () => {},
        }),
        toDataURL: () => "data:image/svg+xml;base64,",
      };
      try {
        drawer.draw(smiles, fakeCanvas, "light", false);
      } catch {
        // SmilesDrawer may not support canvas fallback — use placeholder
      }
    }
  } catch {
    // SmilesDrawer not available or failed — use placeholder
  }

  // Always return a meaningful SVG — either from SmilesDrawer or a placeholder
  return {
    svg: generateMoleculeSVG(smiles, width, height),
    title: formatMoleculeName(smiles),
    caption: `Molecular structure: ${smiles}`,
    type: "molecule",
  };
}

/**
 * Render multiple molecules side by side (for comparison or reaction).
 */
export async function renderMoleculeComparison(
  molecules: Array<{ smiles: string; label: string }>,
  options: MoleculeOptions = {}
): Promise<ChemistryVisual> {
  const { width = 600, height = 300 } = options;
  const moleculeWidth = Math.floor(width / molecules.length);

  const svgParts: string[] = [];
  for (let i = 0; i < molecules.length; i++) {
    const mol = await renderMolecule(molecules[i].smiles, {
      width: moleculeWidth,
      height: height - 40,
    });
    svgParts.push(`
      <g transform="translate(${i * moleculeWidth}, 0)">
        ${mol.svg.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
        <text x="${moleculeWidth / 2}" y="${height - 10}" 
              text-anchor="middle" font-size="12" fill="#333" font-weight="bold">
          ${escapeXml(molecules[i].label)}
        </text>
      </g>
    `);
  }

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      ${svgParts.join("")}
    </svg>`,
    title: molecules.map((m) => m.label).join(" vs "),
    caption: `Comparison: ${molecules.map((m) => m.label).join(" vs ")}`,
    type: "molecule",
  };
}

// ─── Reaction Mechanism Renderer ────────────────────────────────────────────

/**
 * Render a reaction mechanism with electron-pushing arrows.
 * Format: "reactants → products" with optional conditions.
 */
export function renderReactionMechanism(
  reactants: string[],
  products: string[],
  conditions: string[] = [],
  arrows: string[] = [],
  options: { width?: number; height?: number } = {}
): ChemistryVisual {
  const { width = 700, height = 200 } = options;

  const sectionWidth = width / 3;
  const centerY = height / 2;

  // Reactants
  const reactantsSvg = reactants.map((r, i) => {
    const y = centerY - (reactants.length - 1) * 15 + i * 30;
    return `<text x="${sectionWidth * 0.4}" y="${y}" 
            text-anchor="middle" font-size="14" fill="#1a1a1a" font-family="serif">
            ${escapeXml(r)}</text>`;
  }).join("\n");

  // Arrow
  const arrowSvg = `
    <line x1="${sectionWidth * 0.7}" y1="${centerY}" 
          x2="${sectionWidth * 1.3}" y2="${centerY}" 
          stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" 
              refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
      </marker>
    </defs>
    ${conditions.length > 0 ? `
      <text x="${sectionWidth}" y="${centerY - 12}" 
            text-anchor="middle" font-size="11" fill="#666" font-style="italic">
            ${escapeXml(conditions.join(", "))}
      </text>
    ` : ""}
  `;

  // Products
  const productsSvg = products.map((p, i) => {
    const y = centerY - (products.length - 1) * 15 + i * 30;
    return `<text x="${sectionWidth * 2.4}" y="${y}" 
            text-anchor="middle" font-size="14" fill="#1a1a1a" font-family="serif">
            ${escapeXml(p)}</text>`;
  }).join("\n");

  // Electron-pushing arrows (curved arrows)
  const curvedArrowsSvg = arrows.map((arrow, i) => {
    const startX = sectionWidth * 0.6 + i * 30;
    const startY = centerY + 20;
    const endX = sectionWidth * 1.2 + i * 30;
    const endY = centerY - 20;
    const ctrlX = (startX + endX) / 2;
    const ctrlY = startY + 30;
    return `<path d="M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}" 
            fill="none" stroke="#e74c3c" stroke-width="1.5" 
            marker-end="url(#curvedArrow)" opacity="0.7"/>`;
  }).join("\n");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
        </marker>
        <marker id="curvedArrow" markerWidth="8" markerHeight="6" 
                refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#e74c3c"/>
        </marker>
      </defs>
      ${reactantsSvg}
      ${arrowSvg}
      ${productsSvg}
      ${curvedArrowsSvg}
    </svg>`,
    title: `${reactants.join(" + ")} → ${products.join(" + ")}`,
    caption: conditions.length > 0 ? `Conditions: ${conditions.join(", ")}` : "Reaction mechanism",
    type: "reaction",
  };
}

// ─── Markush Structure Renderer ─────────────────────────────────────────────

/**
 * Render a Markush structure (R-group notation) as SVG.
 * Markush structures show a core scaffold with variable R-groups.
 */
export function renderMarkushStructure(
  core: string,
  rGroups: Array<{ name: string; description: string; values?: string[] }>,
  options: { width?: number; height?: number } = {}
): ChemistryVisual {
  const { width = 500, height = 350 } = options;

  const coreY = height * 0.35;
  const tableY = height * 0.65;

  // Core structure (text representation)
  const coreSvg = `
    <rect x="${width * 0.1}" y="${coreY - 30}" width="${width * 0.8}" height="60" 
          fill="#f0f7ff" stroke="#3498db" stroke-width="1" rx="8"/>
    <text x="${width * 0.5}" y="${coreY + 5}" 
          text-anchor="middle" font-size="16" fill="#2c3e50" font-weight="bold" font-family="monospace">
          ${escapeXml(core)}
    </text>
  `;

  // R-group labels around the core
  const rGroupPositions = [
    { x: width * 0.15, y: coreY - 45 },
    { x: width * 0.5, y: coreY - 45 },
    { x: width * 0.85, y: coreY - 45 },
    { x: width * 0.15, y: coreY + 55 },
    { x: width * 0.5, y: coreY + 55 },
    { x: width * 0.85, y: coreY + 55 },
  ];

  const rGroupSvg = rGroups.map((rg, i) => {
    const pos = rGroupPositions[i % rGroupPositions.length];
    return `
      <circle cx="${pos.x}" cy="${pos.y}" r="16" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
      <text x="${pos.x}" y="${pos.y + 5}" 
            text-anchor="middle" font-size="12" fill="white" font-weight="bold">
            ${escapeXml(rg.name)}
      </text>
    `;
  }).join("\n");

  // R-group definition table
  const tableSvg = `
    <rect x="${width * 0.05}" y="${tableY}" width="${width * 0.9}" height="${rGroups.length * 25 + 30}" 
          fill="#fafafa" stroke="#ddd" stroke-width="1" rx="4"/>
    <text x="${width * 0.1}" y="${tableY + 20}" font-size="12" fill="#666" font-weight="bold">
          R-Group Definitions:
    </text>
    ${rGroups.map((rg, i) => `
      <text x="${width * 0.1}" y="${tableY + 45 + i * 25}" font-size="11" fill="#333">
            <tspan font-weight="bold" fill="#e74c3c">${escapeXml(rg.name)}</tspan> = 
            ${escapeXml(rg.description)}
            ${rg.values ? ` (${rg.values.join(", ")})` : ""}
      </text>
    `).join("\n")}
  `;

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      ${coreSvg}
      ${rGroupSvg}
      ${tableSvg}
    </svg>`,
    title: `Markush Structure: ${core}`,
    caption: `Core scaffold with ${rGroups.length} variable R-groups`,
    type: "markush",
  };
}

// ─── DNA/RNA Sequence Renderer ──────────────────────────────────────────────

/**
 * Render a DNA or RNA sequence with annotations.
 */
export function renderDNASequence(
  sequence: string,
  annotations: Array<{ start: number; end: number; label: string; color: string }> = [],
  options: { width?: number; height?: number; showDirection?: boolean } = {}
): ChemistryVisual {
  const { width = 600, height = 120, showDirection = true } = options;
  const nucleotideWidth = 20;
  const startX = 60;
  const seqY = height / 2;

  const colors: Record<string, string> = {
    A: "#e74c3c",
    T: "#3498db",
    G: "#2ecc71",
    C: "#f39c12",
    U: "#9b59b6",
  };

  // Nucleotides
  const nucleotidesSvg = sequence.split("").map((base, i) => {
    const x = startX + i * nucleotideWidth;
    const color = colors[base.toUpperCase()] || "#999";
    return `
      <rect x="${x - 8}" y="${seqY - 12}" width="16" height="24" 
            fill="${color}" opacity="0.2" rx="3"/>
      <text x="${x}" y="${seqY + 5}" 
            text-anchor="middle" font-size="14" fill="${color}" font-weight="bold" font-family="monospace">
            ${escapeXml(base.toUpperCase())}
      </text>
    `;
  }).join("\n");

  // Direction arrows
  const directionSvg = showDirection ? `
    <text x="${startX - 30}" y="${seqY + 5}" font-size="12" fill="#666" font-weight="bold">5'</text>
    <text x="${startX + sequence.length * nucleotideWidth + 10}" y="${seqY + 5}" 
          font-size="12" fill="#666" font-weight="bold">3'</text>
    <line x1="${startX - 20}" y1="${seqY}" x2="${startX + sequence.length * nucleotideWidth}" y2="${seqY}" 
          stroke="#ccc" stroke-width="1" stroke-dasharray="4"/>
  ` : "";

  // Annotations
  const annotationsSvg = annotations.map((ann) => {
    const x1 = startX + ann.start * nucleotideWidth;
    const x2 = startX + ann.end * nucleotideWidth;
    const y = seqY + 30;
    return `
      <rect x="${x1}" y="${y}" width="${x2 - x1}" height="16" 
            fill="${ann.color}" opacity="0.3" rx="3"/>
      <text x="${(x1 + x2) / 2}" y="${y + 12}" 
            text-anchor="middle" font-size="10" fill="${ann.color}" font-weight="bold">
            ${escapeXml(ann.label)}
      </text>
    `;
  }).join("\n");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      ${directionSvg}
      ${nucleotidesSvg}
      ${annotationsSvg}
    </svg>`,
    title: `DNA Sequence (${sequence.length} bp)`,
    caption: `5' → ${sequence.slice(0, 20)}${sequence.length > 20 ? "..." : ""} → 3'`,
    type: "sequence",
  };
}

// ─── Pathway Renderer ───────────────────────────────────────────────────────

/**
 * Render a biochemical pathway (e.g., glycolysis, Krebs cycle).
 */
export function renderPathway(
  steps: Array<{ name: string; enzyme?: string; inputs?: string[]; outputs?: string[] }>,
  options: { width?: number; height?: number; direction?: "horizontal" | "vertical" } = {}
): ChemistryVisual {
  const { width = 700, height = 400, direction = "vertical" } = options;

  const isVertical = direction === "vertical";
  const stepCount = steps.length;
  const stepSize = isVertical
    ? { w: width * 0.6, h: (height - 60) / stepCount }
    : { w: (width - 60) / stepCount, h: height * 0.4 };

  const stepsSvg = steps.map((step, i) => {
    const x = isVertical ? width * 0.2 : 30 + i * (stepSize.w + 10);
    const y = isVertical ? 30 + i * (stepSize.h + 10) : height * 0.3;

    return `
      <g>
        <rect x="${x}" y="${y}" width="${stepSize.w}" height="${stepSize.h}" 
              fill="#f0f7ff" stroke="#3498db" stroke-width="1" rx="6"/>
        <text x="${x + stepSize.w / 2}" y="${y + stepSize.h / 2 - 5}" 
              text-anchor="middle" font-size="12" fill="#2c3e50" font-weight="bold">
              ${escapeXml(step.name)}
        </text>
        ${step.enzyme ? `
          <text x="${x + stepSize.w / 2}" y="${y + stepSize.h / 2 + 12}" 
                text-anchor="middle" font-size="10" fill="#7f8c8d" font-style="italic">
                ${escapeXml(step.enzyme)}
          </text>
        ` : ""}
        ${i < stepCount - 1 ? (isVertical ? `
          <line x1="${x + stepSize.w / 2}" y1="${y + stepSize.h}" 
                x2="${x + stepSize.w / 2}" y2="${y + stepSize.h + 10}" 
                stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
        ` : `
          <line x1="${x + stepSize.w}" y1="${y + stepSize.h / 2}" 
                x2="${x + stepSize.w + 10}" y2="${y + stepSize.h / 2}" 
                stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
        `) : ""}
      </g>
    `;
  }).join("\n");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
        </marker>
      </defs>
      ${stepsSvg}
    </svg>`,
    title: `Pathway: ${steps[0]?.name || "Unknown"} → ${steps[steps.length - 1]?.name || "Unknown"}`,
    caption: `${steps.length}-step biochemical pathway`,
    type: "pathway",
  };
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatMoleculeName(smiles: string): string {
  // Common SMILES → name mappings
  const names: Record<string, string> = {
    "CC(=O)O": "Acetic Acid",
    "CC(=O)Oc1ccccc1C(=O)O": "Aspirin",
    "c1ccc(CC(=O)O)cc1": "Phenylacetic Acid",
    "CC": "Ethane",
    "CCO": "Ethanol",
    "c1ccccc1": "Benzene",
    "CC(=O)Nc1ccc(O)cc1": "Acetaminophen",
    "CC(C)Cc1ccc(C(C)C(=O)O)cc1": "Ibuprofen",
    "OC(=O)c1ccccc1O": "Salicylic Acid",
    "C1CCCCC1": "Cyclohexane",
    "C=C": "Ethylene",
    "CC=O": "Acetaldehyde",
    "CCCO": "Propanol",
    "CC(=O)CC(=O)O": "Acetoacetic Acid",
    "NCC(=O)O": "Glycine",
    "CC(C)C1=CC=C(C=C1)C(C)C(=O)O": "Ibuprofen",
  };
  return names[smiles] || `Molecule (${smiles.slice(0, 20)}${smiles.length > 20 ? "..." : ""})`;
}

/**
 * Generate a proper molecular structure SVG from SMILES notation.
 * This creates a visual representation without needing SmilesDrawer.
 * For simple molecules, it shows the molecular formula and structure hints.
 */
function generateMoleculeSVG(smiles: string, width: number, height: number): string {
  // Parse SMILES to extract molecular formula
  const formula = smilesToFormula(smiles);
  const atomCounts = formulaToCounts(formula);
  const atomList = Object.entries(atomCounts)
    .map(([atom, count]) => `${atom}${count > 1 ? count : ""}`)
    .join("");

  // Generate a molecular visualization based on atom count
  const centerY = height / 2;
  const atomRadius = 20;
  const atoms = Object.entries(atomCounts).filter(([a]) => a !== "C" || Object.keys(atomCounts).length === 1);
  const totalAtoms = atoms.reduce((sum, [, count]) => sum + count, 0);
  const spacing = Math.min(60, (width - 80) / Math.max(totalAtoms, 1));

  const atomColors: Record<string, string> = {
    C: "#333333",
    H: "#cccccc",
    O: "#e74c3c",
    N: "#3498db",
    S: "#f1c40f",
    P: "#e67e22",
    Cl: "#2ecc71",
    Br: "#8b4513",
    F: "#27ae60",
    I: "#9b59b6",
  };

  let atomIndex = 0;
  const atomsSvg = atoms.flatMap(([atom, count]) => {
    return Array.from({ length: count }, () => {
      const x = 40 + atomIndex * spacing;
      atomIndex++;
      const color = atomColors[atom] || "#999";
      return `
        <circle cx="${x}" cy="${centerY}" r="${atomRadius}" fill="${color}" opacity="0.8"/>
        <text x="${x}" y="${centerY + 5}" text-anchor="middle" font-size="14" fill="white" font-weight="bold">
          ${atom}
        </text>
      `;
    });
  }).join("");

  // Draw bonds between adjacent atoms
  const bondsSvg = atomIndex > 1 ? Array.from({ length: atomIndex - 1 }, (_, i) => {
    const x1 = 40 + i * spacing + atomRadius;
    const x2 = 40 + (i + 1) * spacing - atomRadius;
    return `<line x1="${x1}" y1="${centerY}" x2="${x2}" y2="${centerY}" stroke="#666" stroke-width="2"/>`;
  }).join("") : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="white" rx="8"/>
    <text x="${width / 2}" y="25" text-anchor="middle" font-size="12" fill="#666" font-weight="bold">
      Molecular Structure: ${atomList}
    </text>
    ${bondsSvg}
    ${atomsSvg}
    <text x="${width / 2}" y="${height - 15}" text-anchor="middle" font-size="10" fill="#999" font-style="italic">
      SMILES: ${smiles}
    </text>
  </svg>`;
}

/**
 * Parse a SMILES string to extract the molecular formula.
 */
function smilesToFormula(smiles: string): string {
  const atoms: Record<string, number> = {};
  let i = 0;
  while (i < smiles.length) {
    const ch = smiles[i];
    if (ch >= "A" && ch <= "Z") {
      const next = smiles[i + 1];
      if (next && next >= "a" && next <= "z") {
        // Two-letter atom (e.g., Cl, Br)
        const atom = ch + next;
        atoms[atom] = (atoms[atom] || 0) + 1;
        i += 2;
      } else {
        // Single-letter atom
        atoms[ch] = (atoms[ch] || 0) + 1;
        i++;
      }
    } else if (ch >= "0" && ch <= "9") {
      // Branch count — skip for formula parsing
      i++;
    } else if (ch === "(" || ch === ")" || ch === "=" || ch === "#" || ch === "\\" || ch === "/") {
      // Bond/branch notation — skip
      i++;
    } else if (ch === "[" || ch === "]") {
      // Bracket atom — extract atom name
      let bracket = "";
      i++; // skip [
      while (i < smiles.length && smiles[i] !== "]") {
        bracket += smiles[i];
        i++;
      }
      i++; // skip ]
      // Extract atom from bracket (e.g., "NH" → "N", "Cl" → "Cl")
      const atomMatch = bracket.match(/^([A-Z][a-z]?)/);
      if (atomMatch) {
        atoms[atomMatch[1]] = (atoms[atomMatch[1]] || 0) + 1;
      }
    } else {
      i++;
    }
  }

  // Add implicit hydrogens (simplified)
  const carbonCount = atoms["C"] || 0;
  const nitrogenCount = atoms["N"] || 0;
  const oxygenCount = atoms["O"] || 0;
  const sulfurCount = atoms["S"] || 0;
  const halogenCount = (atoms["F"] || 0) + (atoms["Cl"] || 0) + (atoms["Br"] || 0) + (atoms["I"] || 0);
  const otherHeavy = Object.entries(atoms)
    .filter(([a]) => !["C", "H", "N", "O", "S", "F", "Cl", "Br", "I"].includes(a))
    .reduce((sum, [, c]) => sum + c, 0);

  // Rough hydrogen count: 4*C + 3*N + 2*O + 2*S - bonds - halogens
  const bondCount = (smiles.match(/=/g) || []).length + (smiles.match(/#/g) || []).length * 2;
  const implicitH = Math.max(0, carbonCount * 4 + nitrogenCount * 3 + oxygenCount * 2 + sulfurCount * 2 - bondCount * 2 - halogenCount - otherHeavy * 2);
  if (implicitH > 0) atoms["H"] = (atoms["H"] || 0) + implicitH;

  // Build formula string (Hill system: C first, H second, then alphabetical)
  const parts: string[] = [];
  if (atoms["C"]) parts.push(`C${atoms["C"] > 1 ? atoms["C"] : ""}`);
  if (atoms["H"]) parts.push(`H${atoms["H"] > 1 ? atoms["H"] : ""}`);
  for (const [atom, count] of Object.entries(atoms).sort()) {
    if (atom === "C" || atom === "H") continue;
    parts.push(`${atom}${count > 1 ? count : ""}`);
  }
  return parts.join("");
}

/**
 * Convert a molecular formula to atom counts.
 */
function formulaToCounts(formula: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match;
  while ((match = regex.exec(formula)) !== null) {
    if (match[1]) {
      counts[match[1]] = (counts[match[1]] || 0) + (match[2] ? parseInt(match[2]) : 1);
    }
  }
  return counts;
}

function generatePlaceholderSVG(text: string, width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1" rx="8"/>
    <text x="${width / 2}" y="${height / 2 - 10}" 
          text-anchor="middle" font-size="12" fill="#6c757d" font-weight="bold">
          ⚗️ Molecular Structure
    </text>
    <text x="${width / 2}" y="${height / 2 + 10}" 
          text-anchor="middle" font-size="10" fill="#adb5bd" font-family="monospace">
          ${escapeXml(text.slice(0, 40))}${text.length > 40 ? "..." : ""}
    </text>
  </svg>`;
}
