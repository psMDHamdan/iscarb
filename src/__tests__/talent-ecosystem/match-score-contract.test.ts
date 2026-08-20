/**
 * Brief-specified location for the shared match-score contract test (Finding W4).
 *
 * The repo's vitest config runs `tests/**` (see vitest.config.ts), so the
 * executable, authoritative copy of this contract lives at
 * `tests/talent-ecosystem/match-score-contract.test.ts`. This file exists at the
 * path named in the task brief and simply re-runs that same suite, so referring
 * to either path resolves to one identical set of golden assertions.
 */
import "../../../tests/talent-ecosystem/match-score-contract.test";
