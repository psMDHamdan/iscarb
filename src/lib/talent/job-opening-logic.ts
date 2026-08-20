/**
 * iSCARB Talent Ecosystem — SHARED JOB OPENING LOGIC (Task 3c)
 * ===========================================================================
 * Pure, dependency-free business logic for shared recruiter↔employer job
 * openings: the status lifecycle, marketplace search/ranking, and CSV bulk
 * import parsing. NO prisma / next / server-only imports — fully unit-testable
 * and shared by both the services and (future) UI (Task 3d/3f). Mirrors the
 * style of `src/apps/recruiter-os/lib/pipeline-logic.ts` (Task 3b).
 * ===========================================================================
 */

import {
  validateRequirements,
  requirementMatchScore,
  type CompetencyRequirement,
  type RequirementValidationError,
} from "./competency-framework";

// ───────────────────────────────────────────────────────────────────────────
//  Status lifecycle:  open → candidates submitted → filled → archived
//  (persisted enum keeps the canonical DB names: draft/posted/closed/filled)
// ───────────────────────────────────────────────────────────────────────────

/** Persisted job status values (align with the JobOpening.status enum). */
export const JOB_STATUSES = [
  "draft",
  "open",
  "submitted",
  "filled",
  "archived",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export function isJobStatus(s: string): s is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(s);
}

/** Allowed forward/backward transitions in the job lifecycle. */
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ["open", "archived"],
  open: ["submitted", "filled", "archived"],
  submitted: ["open", "filled", "archived"],
  filled: ["archived", "open"],
  archived: [],
};

/** Is moving `from` → `to` a legal lifecycle transition? */
export function canTransition(from: JobStatus, to: JobStatus): boolean {
  if (from === to) return true;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export class JobStatusError extends Error {
  constructor(from: string, to: string) {
    super(`illegal job status transition: ${from} → ${to}`);
    this.name = "JobStatusError";
  }
}

/**
 * When a candidate is submitted to an `open` job it advances to `submitted`.
 * Any other status is returned unchanged (already submitted / filled / etc.).
 */
export function statusAfterSubmission(status: JobStatus): JobStatus {
  return status === "open" ? "submitted" : status;
}

// ───────────────────────────────────────────────────────────────────────────
//  Marketplace search model
// ───────────────────────────────────────────────────────────────────────────

/** The searchable, marketplace-facing projection of a job opening. */
export interface JobListing {
  id: string;
  employerId: string;
  employer: string;
  title: string;
  description: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  status: JobStatus;
  requiredCompetencies: CompetencyRequirement[];
  createdAt: string; // ISO
}

export interface JobSearchFilters {
  /** free-text over title + employer + description */
  q?: string;
  company?: string;
  location?: string;
  /** require the job to demand this competency module (e.g. "M18") */
  competency?: string;
  salaryMin?: number;
  /** default: only `open`/`submitted` listings are visible in the marketplace */
  status?: JobStatus | "all";
}

/** Which statuses are publicly visible in the marketplace by default. */
export const MARKETPLACE_VISIBLE: readonly JobStatus[] = ["open", "submitted"];

function includesCI(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Filter a set of listings by marketplace criteria. Returns an EMPTY array when
 * nothing matches (edge case: "search with no results → empty state, not
 * error"), never throws on empty/malformed filters.
 */
export function filterListings(
  listings: JobListing[],
  filters: JobSearchFilters = {},
): JobListing[] {
  const q = filters.q?.trim();
  const company = filters.company?.trim();
  const location = filters.location?.trim();
  const competency = filters.competency?.trim().toUpperCase();
  const wantStatus = filters.status ?? "visible";

  return listings.filter((job) => {
    if (wantStatus === "all") {
      // no status constraint
    } else if (wantStatus === "visible" || wantStatus === undefined) {
      if (!MARKETPLACE_VISIBLE.includes(job.status)) return false;
    } else if (job.status !== wantStatus) {
      return false;
    }

    if (q) {
      const hay = `${job.title} ${job.employer} ${job.description}`;
      if (!includesCI(hay, q)) return false;
    }
    if (company && !includesCI(job.employer, company)) return false;
    if (location && !includesCI(job.location, location)) return false;
    if (competency) {
      const has = job.requiredCompetencies.some(
        (r) => r.module.toUpperCase() === competency,
      );
      if (!has) return false;
    }
    if (
      filters.salaryMin !== undefined &&
      filters.salaryMin !== null &&
      (job.salaryMax ?? job.salaryMin ?? 0) < filters.salaryMin
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Rank filtered listings by a lightweight relevance score (reuses the same
 * 0-100 convention as Task 3a's match-scoring pattern rather than reinventing
 * it): exact-ish query hits in the title score highest, then recency.
 */
export function rankListings(
  listings: JobListing[],
  filters: JobSearchFilters = {},
): Array<JobListing & { relevance: number }> {
  const q = filters.q?.trim().toLowerCase();
  return [...listings]
    .map((job) => {
      let relevance = 50;
      if (q) {
        if (job.title.toLowerCase() === q) relevance = 100;
        else if (job.title.toLowerCase().includes(q)) relevance = 85;
        else if (job.employer.toLowerCase().includes(q)) relevance = 70;
        else if (job.description.toLowerCase().includes(q)) relevance = 60;
      }
      return { ...job, relevance };
    })
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

/**
 * Score a candidate against a listing's competency requirements (delegates to
 * the framework's `requirementMatchScore`), for recruiter-facing candidate
 * ranking within a job.
 */
export function candidateFitForJob(
  job: JobListing,
  candidateLevels: Record<string, number>,
): number {
  return requirementMatchScore(job.requiredCompetencies, candidateLevels);
}

// ───────────────────────────────────────────────────────────────────────────
//  CSV bulk import — RFC-4180 aware parsing, whole-batch validation
// ───────────────────────────────────────────────────────────────────────────

/** The required CSV header columns for bulk job import. */
export const IMPORT_COLUMNS = [
  "title",
  "company",
  "requirements",
  "salary",
] as const;

/** A parsed, validated import row ready for persistence. */
export interface ParsedJobRow {
  title: string;
  company: string;
  requiredCompetencies: CompetencyRequirement[];
  salaryMin: number | null;
  salaryMax: number | null;
  location: string;
  description: string;
}

export interface ImportRowError {
  /** 1-based data row number (excludes the header) */
  row: number;
  field: string;
  message: string;
}

export interface ParseCsvResult {
  ok: boolean;
  rows: ParsedJobRow[];
  errors: ImportRowError[];
}

/**
 * Parse a single CSV line honouring RFC-4180 quoting (quoted fields may contain
 * commas, escaped `""` quotes, and newlines are handled by the record splitter
 * below).
 */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

/**
 * Split CSV text into logical records, correctly keeping newlines that occur
 * INSIDE quoted fields together with their record.
 */
export function splitCsvRecords(text: string): string[] {
  const records: string[] = [];
  let current = "";
  let inQuotes = false;
  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < normalised.length; i++) {
    const ch = normalised[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "\n" && !inQuotes) {
      records.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.length > 0) records.push(current);
  return records.filter((r) => r.trim().length > 0);
}

/** Parse a salary cell: single value "12000" or a range "12000-18000". */
export function parseSalary(raw: string): {
  min: number | null;
  max: number | null;
  error?: string;
} {
  const value = raw.trim().replace(/[^\d.\-]/g, "");
  if (!value) return { min: null, max: null };
  const parts = value.split("-").filter(Boolean);
  if (parts.length === 1) {
    const n = Number(parts[0]);
    if (!Number.isFinite(n) || n < 0) return { min: null, max: null, error: "invalid salary" };
    return { min: n, max: n };
  }
  const min = Number(parts[0]);
  const max = Number(parts[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
    return { min: null, max: null, error: "invalid salary range" };
  }
  return { min, max };
}

/**
 * Parse and validate an entire bulk-import CSV. Validation is done across the
 * WHOLE batch before any row is accepted (all-or-nothing): if any row is
 * malformed, `ok` is false and `errors` carries row-level, field-level messages
 * — rows are never silently skipped (per brief edge cases). Injection-safe: all
 * cells are treated as inert text (no eval, no formula execution) and leading
 * `= + - @` formula-injection markers are stripped from text fields.
 */
export function parseJobImportCsv(text: string): ParseCsvResult {
  const errors: ImportRowError[] = [];
  const rows: ParsedJobRow[] = [];

  const records = splitCsvRecords(text);
  if (records.length === 0) {
    return { ok: false, rows: [], errors: [{ row: 0, field: "file", message: "empty CSV" }] };
  }

  const header = parseCsvLine(records[0]).map((h) => h.trim().toLowerCase());
  const idx: Record<string, number> = {};
  for (const col of IMPORT_COLUMNS) {
    const at = header.indexOf(col);
    if (at === -1) {
      errors.push({ row: 0, field: col, message: `missing required column "${col}"` });
    }
    idx[col] = at;
  }
  // Optional columns.
  idx.location = header.indexOf("location");
  idx.description = header.indexOf("description");

  if (errors.length > 0) {
    return { ok: false, rows: [], errors };
  }

  for (let r = 1; r < records.length; r++) {
    const cells = parseCsvLine(records[r]);
    const rowNo = r; // 1-based data row
    const get = (col: string): string => {
      const at = idx[col];
      return at >= 0 && at < cells.length ? cells[at] : "";
    };

    const title = sanitizeText(get("title"));
    const company = sanitizeText(get("company"));
    if (!title) errors.push({ row: rowNo, field: "title", message: "title is required" });
    if (!company) errors.push({ row: rowNo, field: "company", message: "company is required" });

    const reqResult = validateRequirements(get("requirements"));
    if (!reqResult.ok) {
      reqResult.errors.forEach((e: RequirementValidationError) =>
        errors.push({ row: rowNo, field: "requirements", message: e.reason }),
      );
    }

    const salary = parseSalary(get("salary"));
    if (salary.error) {
      errors.push({ row: rowNo, field: "salary", message: salary.error });
    }

    rows.push({
      title,
      company,
      requiredCompetencies: reqResult.requirements,
      salaryMin: salary.min,
      salaryMax: salary.max,
      location: sanitizeText(get("location")) || "Remote",
      description: sanitizeText(get("description")) || title,
    });
  }

  if (errors.length > 0) {
    // All-or-nothing: report every error, commit nothing.
    return { ok: false, rows: [], errors };
  }
  return { ok: true, rows, errors: [] };
}

/**
 * Strip CSV-injection formula markers and trim. A leading `= + - @` (or tab /
 * CR) is prefixed with `'` per OWASP CSV-injection guidance so the value can
 * never be interpreted as a formula by a spreadsheet consumer.
 */
export function sanitizeText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}
