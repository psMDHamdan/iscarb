export interface PlaceholderConfig {
  slideNo: number;
  fn: string;
  visualIntent: string;
  width?: number;
  height?: number;
}

const FN_COLORS: Record<string, { bg: string; accent: string; icon: string }> = {
  // Legacy names (backward compat)
  hook: { bg: "#1C1917", accent: "#F59E0B", icon: "🎯" },
  domain_spine: { bg: "#1E1B4B", accent: "#8B5CF6", icon: "🗺️" },
  clos: { bg: "#064E3B", accent: "#10B981", icon: "📋" },
  h_stack: { bg: "#0C4A6E", accent: "#38BDF8", icon: "🏗️" },
  foundation: { bg: "#1E3A5F", accent: "#3B82F6", icon: "📐" },
  misconception: { bg: "#431407", accent: "#F97316", icon: "⚠️" },
  deep_dive: { bg: "#0F3460", accent: "#06B6D4", icon: "🔬" },
  application: { bg: "#064E3B", accent: "#14B8A6", icon: "🔧" },
  rubric: { bg: "#3B0764", accent: "#A855F7", icon: "📊" },
  evidence: { bg: "#1E1B4B", accent: "#6366F1", icon: "📁" },
  readiness: { bg: "#052E16", accent: "#22C55E", icon: "✅" },
  // New learning progression names
  problem: { bg: "#1C1917", accent: "#F59E0B", icon: "🎯" },
  mental_map: { bg: "#1E1B4B", accent: "#8B5CF6", icon: "🗺️" },
  prior_knowledge: { bg: "#0C4A6E", accent: "#38BDF8", icon: "🧠" },
  core_concept: { bg: "#1E3A5F", accent: "#3B82F6", icon: "📐" },
  mechanism: { bg: "#1E3A5F", accent: "#60A5FA", icon: "⚙️" },
  worked_example: { bg: "#0F3460", accent: "#06B6D4", icon: "📝" },
  guided_practice: { bg: "#0F3460", accent: "#22D3EE", icon: "🤝" },
  independent_practice: { bg: "#0F3460", accent: "#67E8F9", icon: "🎯" },
  deeper_mechanism: { bg: "#0F3460", accent: "#06B6D4", icon: "🔬" },
  trade_off: { bg: "#064E3B", accent: "#14B8A6", icon: "⚖️" },
  real_case: { bg: "#064E3B", accent: "#2DD4BF", icon: "🏢" },
  guided_application: { bg: "#064E3B", accent: "#14B8A6", icon: "🔧" },
  independent_application: { bg: "#064E3B", accent: "#5EEAD4", icon: "🚀" },
  decision_challenge: { bg: "#431407", accent: "#FB923C", icon: "🤔" },
  transfer_challenge: { bg: "#431407", accent: "#FDBA74", icon: "🔄" },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateVisualPlaceholder(config: PlaceholderConfig): string {
  const w = config.width ?? 400;
  const h = config.height ?? 250;
  const colors = FN_COLORS[config.fn] ?? { bg: "#1F2937", accent: "#6B7280", icon: "🖼️" };

  const words = (config.visualIntent || "").split(/\s+/).filter(Boolean);
  const line1 = words.slice(0, 6).join(" ");
  const line2 = words.slice(6, 12).join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${colors.bg}" rx="12"/>
  <g opacity="0.08" stroke="${colors.accent}" stroke-width="1">
    ${Array.from({ length: 8 }, (_, i) => `<line x1="${(w / 8) * (i + 1)}" y1="0" x2="${(w / 8) * (i + 1)}" y2="${h}"/>`).join("")}
    ${Array.from({ length: 5 }, (_, i) => `<line x1="0" y1="${(h / 5) * (i + 1)}" x2="${w}" y2="${(h / 5) * (i + 1)}"/>`).join("")}
  </g>
  <line x1="0" y1="${h}" x2="${w}" y2="0" stroke="${colors.accent}" stroke-width="1.5" opacity="0.15"/>
  <circle cx="${w / 2}" cy="${h / 2 - 20}" r="32" fill="${colors.accent}" opacity="0.15"/>
  <text x="${w / 2}" y="${h / 2 - 10}" font-size="28" text-anchor="middle" dominant-baseline="middle">${colors.icon}</text>
  <text x="${w / 2}" y="${h / 2 + 28}" font-size="11" fill="${colors.accent}" text-anchor="middle" font-family="monospace" opacity="0.9">${escapeXml(line1)}</text>
  ${line2 ? `<text x="${w / 2}" y="${h / 2 + 44}" font-size="11" fill="${colors.accent}" text-anchor="middle" font-family="monospace" opacity="0.7">${escapeXml(line2)}</text>` : ""}
  <rect x="${w - 44}" y="8" width="36" height="18" rx="6" fill="${colors.accent}" opacity="0.9"/>
  <text x="${w - 26}" y="21" font-size="10" fill="white" text-anchor="middle" font-family="monospace" font-weight="bold">S${config.slideNo}</text>
</svg>`;
}

export function generateVisualPlaceholderDataUrl(config: PlaceholderConfig): string {
  const svg = generateVisualPlaceholder(config);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
