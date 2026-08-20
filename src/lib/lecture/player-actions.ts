/**
 * Lecture Player — action text helpers.
 * ===========================================================================
 * Pure functions used by LecturePlayerView to turn a slide's studentAction
 * string into interactive widgets:
 *
 *   - parsePollAction  → poll question + options (rendered as a real poll)
 *   - stripLeakedAnswer → removes "Ans: X." / "Answer: A" so questions are
 *     not spoiled before the student answers.
 *
 * These are deliberately side-effect free so they can be unit tested.
 */

export interface ParsedPoll {
  question: string;
  options: string[];
}

/**
 * Try to parse a studentAction string as a poll.
 *
 * Handles the shapes emitted by the slide generator:
 *   "Poll: <question>? A) x B) y C) z D) w"
 *   "Poll: <question>? (A) x (B) y (C) z (D) w"
 *   "Poll: <question>? A: x. B: y. C: z. D: w."
 *   "Q: <question>? (A) ... (D) .... Ans: A."
 *   "Poll: <question>? (Novice, Developing, Proficient, Distinguished)"
 *
 * Returns null when the text is not poll-shaped.
 */
export function parsePollAction(text: string | null | undefined): ParsedPoll | null {
  const raw = (text ?? "").trim();
  if (!raw) return null;

  const body = raw
    .replace(/^Poll\s*[:：]\s*/i, "")
    .replace(/^Q\s*[:：]\s*/i, "")
    .replace(/\s*(?:Ans(?:wer)?|Correct answer|Correct Answer)\s*[:：]\s*[A-Da-d][.)]?\s*$/i, "")
    .trim();

  // Collect lettered option markers: "A)", "A:", "(A)", "A." (word-boundary safe).
  // Handles both "(A) x" and "A) x" / "A: x" shapes.
  const markerRe = /\s*(?:\(([A-D])\)|([A-D])[):.])\s*/g;
  const spans: { letter: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(body)) !== null) {
    const letter = m[1] ?? m[2];
    if (!letter) continue;
    const start = m.index + m[0].indexOf(letter);
    // Skip markers that are part of a word (e.g. "DATA:" inside a sentence).
    // Check the char immediately BEFORE the letter, not before the leading
    // whitespace of the match.
    const prev = body[start - 1];
    if (prev && /[A-Za-z0-9]/.test(prev)) continue;
    spans.push({ letter, start });
  }

  if (spans.length >= 2) {
    const question = body.slice(0, spans[0].start).replace(/[\s?:.()]+$/, "").trim();
    const options: string[] = [];
    for (let i = 0; i < spans.length; i++) {
      const start = spans[i].start + 1; // skip the letter itself
      const end = i + 1 < spans.length ? spans[i + 1].start : body.length;
      const optText = body
        .slice(start, end)
        .replace(/^[):.)\s]+/, "") // strip leading ") ", ": " separators
        .replace(/[()\s]+$/, "") // strip trailing "(" from the next marker
        .trim();
      if (optText) options.push(optText);
    }
    if (question && options.length >= 2) return { question, options };
    return null;
  }

  // Fallback: parenthesized comma list, e.g. "(Novice, Developing, Proficient, Distinguished)".
  const paren = body.match(/\(([^()]+)\)\s*$/);
  if (paren && paren[1].includes(",")) {
    const options = paren[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length >= 2) {
      const question = body.replace(paren[0], "").replace(/[\s?:.()]+$/, "").trim();
      if (question) return { question, options };
    }
  }

  return null;
}

/**
 * Remove leaked answers from slide action text.
 *
 * The generator sometimes embeds the answer ("Ans: A.", "Answer: B") or the
 * full option enumeration ("(A) ... (D) .... Ans: A.") in the studentAction
 * field. This strips those so the readiness question isn't spoiled, while
 * keeping genuine reflection/discussion prompts intact.
 */
export function stripLeakedAnswer(text: string | null | undefined): string {
  let t = (text ?? "").trim();
  if (!t) return t;

  // Catch various leaked answer patterns:
  // "Ans: A", "Answer: (B)", "Correct: C", "Correct Answer: D", "The correct answer is A"
  const answerRegex = /\s*(?:Ans(?:wer)?|Correct(?: answer| option)?|The correct answer is)\s*[:：-]?\s*\(?[A-Da-d]\)?[.)]?\s*$/i;
  t = t.replace(answerRegex, "");
  
  // Mid-text occurrences
  const midTextRegex = /\s*(?:Ans(?:wer)?|Correct(?: answer| option)?|The correct answer is)\s*[:：-]?\s*\(?[A-Da-d]\)?[.)]?/gi;
  t = t.replace(midTextRegex, "");

  // Sometimes it leaks as "-> A" or "=> (A)" at the end
  t = t.replace(/\s*(?:->|=>)\s*\(?[A-Da-d]\)?[.)]?\s*$/i, "");

  return t.trim();
}
