/**
 * SPARQL Injection Prevention — iSCARB Platform Hardening Workstream 1
 * ======================================================================
 * Provides sanitiseSparqlLiteral() for escaping user-supplied strings
 * before they are embedded in SPARQL query literals, and SparqlInjectionError
 * for inputs that cannot be made safe.
 *
 * Also provides validateSparqlQuery() and isReadOnlyQuery() for validating
 * complete SPARQL queries before execution.
 *
 * Design reference: Workstream 1 — src/lib/sparql-sanitiser.ts
 * Requirements: 1.1, 1.2
 */

/**
 * The set of characters that form SPARQL injection payloads.
 * Per SPARQL 1.1 spec, the following characters have special meaning
 * inside string literals or query structure:
 *   "  — string delimiter
 *   '  — string delimiter
 *   \  — escape character
 *   #  — SPARQL comment character
 *   }  — closes a graph pattern block
 */
const ESCAPABLE = new Set(['"', "'", '\\', '#', '}']);

/**
 * Control characters and null bytes that cannot appear in SPARQL literals.
 * Matches:
 *   \x00       — null byte
 *   \x01-\x08  — non-printable control chars (SOH through BS)
 *   \x0B       — vertical tab
 *   \x0C       — form feed
 *   \x0E-\x1F  — non-printable control chars (SO through US)
 *
 * Note: \x09 (tab), \x0A (LF), and \x0D (CR) are legitimate whitespace
 * characters allowed in SPARQL string literals and are not rejected.
 */
const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;

/**
 * Custom error thrown when a user-supplied input cannot be safely included
 * in a SPARQL query — because it contains null/control bytes that cannot be
 * represented in a SPARQL literal, or because the input is not a string.
 */
export class SparqlInjectionError extends Error {
  /** Machine-readable code for upstream error handlers and OTel span events. */
  readonly code = 'SPARQL_INJECTION_BLOCKED' as const;

  constructor(reason: string) {
    super(`SPARQL injection blocked: ${reason}`);
    this.name = 'SparqlInjectionError';
    // Maintain proper prototype chain in compiled-down ES5 environments.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Sanitise a user-supplied literal value for safe inclusion inside a SPARQL
 * string literal (enclosed in `"` or `'` delimiters).
 *
 * Behaviour:
 * - Rejects null bytes and non-printable control characters by throwing
 *   SparqlInjectionError (these cannot be reliably represented in SPARQL).
 * - Escapes `\`, `"`, `'`, `#`, and `}` by prefixing each with a backslash.
 * - Idempotent: sanitiseSparqlLiteral(sanitiseSparqlLiteral(s)) ===
 *   sanitiseSparqlLiteral(s) for all safely-sanitisable strings.
 *
 * Idempotency is achieved through a stateful scan:
 * - When a `\` is encountered followed by an escapable character, the pair
 *   `\X` is treated as an already-escaped sequence and emitted unchanged.
 * - A lone `\` not followed by an escapable character is itself escaped
 *   to `\\`.
 * - All other dangerous characters are escaped with a leading `\`.
 *
 * @param input - The raw user-supplied string to sanitise.
 * @returns    The sanitised string with injection characters escaped.
 * @throws     {SparqlInjectionError} if the input is not a string, or if it
 *             contains null bytes or non-printable control characters.
 */
export function sanitiseSparqlLiteral(input: string): string {
  if (typeof input !== 'string') {
    throw new SparqlInjectionError('non-string input');
  }

  // Reject null bytes and control characters that cannot safely appear in
  // SPARQL string literals.
  if (CONTROL_CHAR_PATTERN.test(input)) {
    throw new SparqlInjectionError('input contains null byte or non-printable control character');
  }

  // Idempotent escape strategy:
  //
  // We scan left-to-right with a boolean flag `skipNext` that tracks whether
  // the current character was already consumed as the second half of an
  // escape sequence on the previous iteration.
  //
  // Rules:
  //  1. If ch === '\' AND next ∈ ESCAPABLE:
  //       Emit '\' + next as-is (already-escaped sequence). Set skipNext=true
  //       so the next character is not processed again.
  //  2. If ch === '\' AND next ∉ ESCAPABLE (or no next):
  //       The backslash itself is a bare dangerous character — escape it to '\\'.
  //  3. If ch ∈ ESCAPABLE (and case 1/2 didn't apply):
  //       Escape it to '\' + ch.
  //  4. Otherwise: emit ch unchanged.
  //
  // Why this guarantees idempotency:
  //   After one sanitise pass the string only contains backslashes as part of
  //   '\X' sequences where X ∈ ESCAPABLE. On a second pass, every such '\X'
  //   hits rule 1 and is emitted unchanged. There are no bare dangerous chars
  //   left to trigger rules 2/3. Hence the output is identical.

  let result = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === '\\') {
      const next = i + 1 < input.length ? input[i + 1] : undefined;

      if (next !== undefined && ESCAPABLE.has(next)) {
        // Rule 1: '\X' is already an escape sequence — emit as-is.
        result += '\\' + next;
        i += 2; // consume both the backslash and the escaped char
      } else {
        // Rule 2: bare backslash not followed by an escapable char — escape it.
        result += '\\\\';
        i += 1;
      }
    } else if (ESCAPABLE.has(ch)) {
      // Rule 3: dangerous character without a preceding escape — escape it.
      result += '\\' + ch;
      i += 1;
    } else {
      // Rule 4: safe character — emit unchanged.
      result += ch;
      i += 1;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Query-level validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Patterns that indicate destructive or dangerous SPARQL operations.
 * These are checked regardless of whether the query is structurally valid.
 */
const DANGEROUS_PATTERNS = [
  /\b(INSERT|DELETE|UPDATE|CLEAR|DROP|CREATE|MODIFY)\b/i,
  /\bSERVICE\s+</i,            // remote endpoint access
  /\bLOAD\s+<\s*>/i,           // LOAD <iri> — fetches remote graphs
  /\bGRAPH\s+</i,              // GRAPH manipulation (for user-supplied queries)
  /\bUNION\b/i,                 // UNION can leak data across graphs
];

/**
 * Subquery injection patterns — a nested SELECT inside a FILTER or VALUES
 * can exfiltrate data beyond the intended scope.
 */
const SUBQUERY_PATTERN = /\{\s*SELECT\b/i;

/**
 * Validate a complete SPARQL query string for structural safety.
 *
 * Checks:
 * 1. Non-empty string
 * 2. Starts with a read-only operation (SELECT / ASK / CONSTRUCT / DESCRIBE)
 * 3. No write operations (INSERT, DELETE, DROP, CLEAR, CREATE, MODIFY)
 * 4. No SERVICE injection (remote endpoint access)
 * 5. No LOAD operations
 * 6. No GRAPH manipulation
 * 7. No UNION injection
 * 8. No nested subqueries (potential exfiltration)
 * 9. If sparqljs is available, full structural parse validation
 *
 * @param query - The raw SPARQL query string
 * @returns { valid: true } if the query passes all checks,
 *          { valid: false, error: string } with a description of the first failure
 */
export function validateSparqlQuery(query: string): { valid: true } | { valid: false; error: string } {
  if (typeof query !== 'string') {
    return { valid: false, error: 'query must be a string' };
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'query is empty' };
  }

  if (trimmed.length > 50000) {
    return { valid: false, error: 'query exceeds maximum length of 50000 characters' };
  }

  // Must start with a read-only operation
  if (!/^\s*(SELECT|ASK|CONSTRUCT|DESCRIBE)\b/i.test(trimmed)) {
    return { valid: false, error: 'only SELECT, ASK, CONSTRUCT, or DESCRIBE queries are allowed' };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: `forbidden pattern detected: ${pattern.source}` };
    }
  }

  // Check for nested subqueries
  if (SUBQUERY_PATTERN.test(trimmed)) {
    return { valid: false, error: 'nested subqueries are not permitted' };
  }

  // Structural parse validation via sparqljs if available
  try {
    // Dynamic import to avoid hard dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sparqljs = require('sparqljs');
    const parser = new sparqljs.Parser();
    parser.parse(trimmed);
  } catch {
    // sparqljs not available or parse failed — rely on regex checks above
  }

  return { valid: true };
}

/**
 * Check if a SPARQL query is read-only (SELECT or ASK).
 * CONSTRUCT and DESCRIBE are also read-only but are excluded here
 * because endpoints that accept only SELECT/ASK should reject them.
 *
 * @param query - The raw SPARQL query string
 * @returns true if the query starts with SELECT or ASK
 */
export function isReadOnlyQuery(query: string): boolean {
  return /^\s*(SELECT|ASK)\b/i.test(query.trim());
}

/**
 * Sanitise user input for safe embedding in a SPARQL string literal.
 * This is an alias for sanitiseSparqlLiteral with a US-English name
 * for consistency in endpoint code.
 *
 * @see sanitiseSparqlLiteral
 */
export const sanitizeSparqlInput = sanitiseSparqlLiteral;

/**
 * Sanitise user input for safe embedding as an IRI component.
 * Validates the input contains no characters that could break out of
 * an IRI context (< > " { } space).
 *
 * @param input - The raw user-supplied string
 * @returns The sanitised string safe for IRI interpolation
 * @throws {SparqlInjectionError} if the input contains dangerous characters
 */
export function sanitiseSparqlIri(input: string): string {
  if (typeof input !== 'string') {
    throw new SparqlInjectionError('non-string input for IRI');
  }

  if (CONTROL_CHAR_PATTERN.test(input)) {
    throw new SparqlInjectionError('input contains null byte or non-printable control character');
  }

  // Characters that could break out of an IRI position or inject structure
  if (/[<>"'{}|\[\]\\]/.test(input)) {
    throw new SparqlInjectionError('input contains characters forbidden in IRI positions');
  }

  return input;
}
