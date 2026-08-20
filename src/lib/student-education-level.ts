export function getEducationLevelLabel(code?: string | null): string {
  const map: Record<string, string> = { "6": "Bachelor", "7": "Master", "8": "Doctorate" };
  return map[code || "6"] || "Unknown";
}
export function educationLevelCodeOrNull(v?: string | null): string | null {
  return v || null;
}
