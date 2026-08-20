/**
 * Departmental & Institutional Profile Governance (FR-013).
 * ===========================================================================
 * Canonical JSON serialization, deterministic SHA-256 hashing, system default
 * fallbacks, and active profile resolution for multi-tenant governance.
 */
import { createHash } from "crypto";
import { db } from "@/lib/db";

export type ProfileType = "visual" | "language" | "institutional" | "source";

export const PROFILE_TYPES: readonly ProfileType[] = [
  "visual",
  "language",
  "institutional",
  "source",
] as const;

// ---------------------------------------------------------------------------
// Canonical JSON & Deterministic Hashing
// ---------------------------------------------------------------------------

/**
 * Recursively canonicalize any JSON-serializable value:
 * - Object keys sorted alphabetically (Unicode code-point order)
 * - Arrays preserve order, elements canonicalized recursively
 * - Primitives serialized without extraneous whitespace
 * - Circular references detected and thrown
 */
export function canonicalJson(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return JSON.stringify(value);
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalJson(item, seen));
    return `[${items.join(",")}]`;
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      throw new Error("Circular reference detected during canonical JSON serialization");
    }
    seen.add(value);

    const keys = Object.keys(value as Record<string, unknown>).sort();
    const entries: string[] = [];

    for (const key of keys) {
      const val = (value as Record<string, unknown>)[key];
      if (val !== undefined && typeof val !== "function" && typeof val !== "symbol") {
        entries.push(`${JSON.stringify(key)}:${canonicalJson(val, seen)}`);
      }
    }

    seen.delete(value);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(String(value));
}

/**
 * Computes deterministic SHA-256 hash over canonical JSON representation.
 */
export function canonicalProfileHash(value: unknown): string {
  const canonical = canonicalJson(value);
  return createHash("sha256").update(canonical, "utf-8").digest("hex");
}

/** Aliases for canonicalProfileHash */
export const computeProfileHash = canonicalProfileHash;
export const computeCanonicalProfileHash = canonicalProfileHash;

// ---------------------------------------------------------------------------
// System Default Fallback Profiles
// ---------------------------------------------------------------------------

export const DEFAULT_VISUAL_PROFILE: Record<string, unknown> = {
  name: "Institutional Modern (ZTM Standard)",
  palette: {
    background: "#F8FAFC",
    text: "#0F172A",
    body: "#334155",
    accent: "#0F7B8A",
    muted: "#64748B",
    primary: "#0E6C3C",
    secondary: "#1E293B",
    cardBackground: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  typography: {
    fontEnglish: "Inter",
    fontArabic: "Cairo",
    titleFontSizePt: 32,
    bodyFontSizePt: 24,
    bulletFontSizePt: 20,
    codeFont: "Fira Code",
  },
  geometry: {
    aspectRatio: "16:9",
    slideWidthInches: 10,
    slideHeightInches: 7.5,
    progressHeightFraction: 0.08,
    maxBulletsPerSlide: 5,
  },
  branding: {
    logoUrl: "",
    logoPosition: "top-right",
    watermarkText: "iSCARB Institutional Standard",
    enableHeaderRule: true,
    enableFooterBreadcrumbs: true,
  },
};

export const DEFAULT_LANGUAGE_PROFILE: Record<string, unknown> = {
  name: "Higher Education Bilingual Policy",
  defaultLanguage: "en",
  policy: "bilingual",
  bilingualMode: "parallel",
  direction: "ltr",
  arabicFontScale: 1.15,
  terminologyDictionary: {
    "Learning Outcome": "مخرج التعلم",
    Assessment: "تقييم",
    Prerequisite: "متطلب سابق",
  },
  tone: "academic_formal",
  requireArabicSummaries: true,
  enforceTermConsistency: true,
};

export const DEFAULT_INSTITUTIONAL_PROFILE: Record<string, unknown> = {
  name: "NCAAA & Bloom Aligned Framework",
  framework: "Bloom_Revised_2001",
  bloomDistributionTargets: {
    remember: 10,
    understand: 20,
    apply: 35,
    analyze: 25,
    evaluate: 10,
    create: 0,
  },
  minimumHigherOrderPercent: 35,
  slideArchitecture: {
    totalSlides: 20,
    foundationSlides: [1, 2, 3, 4],
    coreConceptSlides: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    synthesisSlides: [18, 19],
    gateAssessmentSlide: 20,
  },
  interactiveCheckpoints: {
    embeddedCheckSlides: [4, 10, 15],
    gateSlide: 20,
    questionsPerCheck: 1,
    optionsPerQuestion: 4,
  },
  gateEnforcement: {
    strictErrorBlocking: true,
    allowFacultyWaiversOnWarnings: true,
    requireDeanSignoffOnAccreditationWaivers: true,
  },
  saudiLocalization: {
    enableVision2030Integration: true,
    requireSystemSuggestedLabelOnDerivedCases: true,
    groundingSourceKey: "vision2030",
  },
};

export const DEFAULT_SOURCE_PROFILE: Record<string, unknown> = {
  name: "National Standards Whitelist",
  allowedDomains: [
    "*.gov.sa",
    "*.edu.sa",
    "etec.gov.sa",
    "ncaaa.gov.sa",
    "vision2030.gov.sa",
  ],
  syncPolicy: "scheduled",
  syncIntervalHours: 24,
  staleThresholdDays: 90,
  minMatchConfidenceThreshold: 0.85,
  requireTranslationApproval: true,
  defaultSnapshotMode: "official_jaheziah",
};

export const DEFAULT_PROFILES_BY_TYPE: Record<ProfileType, Record<string, unknown>> = {
  visual: DEFAULT_VISUAL_PROFILE,
  language: DEFAULT_LANGUAGE_PROFILE,
  institutional: DEFAULT_INSTITUTIONAL_PROFILE,
  source: DEFAULT_SOURCE_PROFILE,
};

// ---------------------------------------------------------------------------
// Active Profile Types & Resolution
// ---------------------------------------------------------------------------

export interface ActiveProfileEntry {
  id: string | null;
  version: number | null;
  profileType: ProfileType;
  schema: Record<string, unknown>;
  hash: string;
  effectiveAt: Date | string | null;
  isDefault: boolean;
}

export interface ProfileVersionSummaryItem {
  id: string | null;
  version: number | null;
  hash: string;
  isDefault: boolean;
}

export interface ActiveProfilesResolution {
  tenantId: string;
  visual: ActiveProfileEntry;
  language: ActiveProfileEntry;
  institutional: ActiveProfileEntry;
  source: ActiveProfileEntry;
  compositeHash: string;
  profileVersionsSummary: {
    visual: ProfileVersionSummaryItem;
    language: ProfileVersionSummaryItem;
    institutional: ProfileVersionSummaryItem;
    source: ProfileVersionSummaryItem;
  };
}

/**
 * Computes composite profile hash over the 4 individual domain hashes or schemas.
 */
export function computeCompositeProfileHash(hashesOrSchemas: {
  visual: string | Record<string, unknown>;
  language: string | Record<string, unknown>;
  institutional: string | Record<string, unknown>;
  source: string | Record<string, unknown>;
}): string {
  const getHash = (val: string | Record<string, unknown>): string => {
    if (typeof val === "string" && /^[a-f0-9]{64}$/i.test(val)) {
      return val;
    }
    return canonicalProfileHash(val);
  };

  return canonicalProfileHash({
    institutional: getHash(hashesOrSchemas.institutional),
    language: getHash(hashesOrSchemas.language),
    source: getHash(hashesOrSchemas.source),
    visual: getHash(hashesOrSchemas.visual),
  });
}

/**
 * Resolves active profiles for a given tenant.
 * Falls back to system defaults for any unconfigured profile domain.
 */
export async function getActiveProfiles(
  tenantId: string,
  databaseClient: any = db
): Promise<ActiveProfilesResolution> {
  const activeRecords = await databaseClient.lectureProfileVersion.findMany({
    where: {
      tenantId,
      status: "active",
    },
    orderBy: { version: "desc" },
  });

  const recordByType = new Map<string, any>();
  for (const record of activeRecords) {
    if (!recordByType.has(record.profileType)) {
      recordByType.set(record.profileType, record);
    }
  }

  const resolveType = (type: ProfileType): ActiveProfileEntry => {
    const record = recordByType.get(type);
    if (record) {
      const schema = (record.schema ?? {}) as Record<string, unknown>;
      const hash = canonicalProfileHash(schema);
      return {
        id: record.id,
        version: record.version,
        profileType: type,
        schema,
        hash,
        effectiveAt: record.effectiveAt,
        isDefault: false,
      };
    }

    const defaultSchema = DEFAULT_PROFILES_BY_TYPE[type];
    const hash = canonicalProfileHash(defaultSchema);
    return {
      id: null,
      version: null,
      profileType: type,
      schema: defaultSchema,
      hash,
      effectiveAt: null,
      isDefault: true,
    };
  };

  const visual = resolveType("visual");
  const language = resolveType("language");
  const institutional = resolveType("institutional");
  const source = resolveType("source");

  const compositeHash = computeCompositeProfileHash({
    visual: visual.hash,
    language: language.hash,
    institutional: institutional.hash,
    source: source.hash,
  });

  const profileVersionsSummary = {
    visual: {
      id: visual.id,
      version: visual.version,
      hash: visual.hash,
      isDefault: visual.isDefault,
    },
    language: {
      id: language.id,
      version: language.version,
      hash: language.hash,
      isDefault: language.isDefault,
    },
    institutional: {
      id: institutional.id,
      version: institutional.version,
      hash: institutional.hash,
      isDefault: institutional.isDefault,
    },
    source: {
      id: source.id,
      version: source.version,
      hash: source.hash,
      isDefault: source.isDefault,
    },
  };

  return {
    tenantId,
    visual,
    language,
    institutional,
    source,
    compositeHash,
    profileVersionsSummary,
  };
}
