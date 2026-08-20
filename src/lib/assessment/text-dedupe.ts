export function asSentence(text: string): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

/** Content words (≥4 chars) for overlap checks between justifications. */
export function contentTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4),
  );
}

/** True when two sentences largely restate the same root issue. */
export function sharesRootIssue(a: string, b: string): boolean {
  const A = contentTokens(a);
  const B = contentTokens(b);
  if (A.size === 0 || B.size === 0) return false;
  let overlap = 0;
  for (const t of A) {
    if (B.has(t)) overlap += 1;
  }
  return overlap / Math.min(A.size, B.size) >= 0.5;
}

export function pushDistinctSentence(sentences: string[], next: string): boolean {
  const s = asSentence(next);
  if (!s) return false;
  if (sentences.some((ex) => sharesRootIssue(ex, s))) return false;
  sentences.push(s);
  return true;
}
