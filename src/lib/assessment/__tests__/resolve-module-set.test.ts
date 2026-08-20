import { resolveAssessmentModuleSet } from "../catalog";

/** L3 catalog tracks — now resolve to exactly 3 real Mxx Job-Fit codes, not 47. */
const CATALOG_TRACKS: Array<{ spec: string; jobFit: [string, string, string] }> = [
  { spec: "Digital Marketing", jobFit: ["M21", "M22", "M23"] },
  { spec: "Business Development", jobFit: ["M24", "M25", "M26"] },
  { spec: "Project Management", jobFit: ["M27", "M28", "M29"] },
  { spec: "Data Analysis", jobFit: ["M30", "M31", "M32"] },
  { spec: "Human Resources", jobFit: ["M33", "M34", "M35"] },
  { spec: "Web Development", jobFit: ["M36", "M37", "M38"] },
];

const BLUEPRINT_MAJORS = ["Accounting", "Cybersecurity", "Finance"];

describe("resolveAssessmentModuleSet — L3 catalog tracks", () => {
  test.each(CATALOG_TRACKS)(
    "'$spec' → full catalog (47 modules)",
    ({ spec, jobFit }) => {
      const { modules, mode, jobFitSource } = resolveAssessmentModuleSet(spec);
      expect(mode).toBe("universal-plus-jobfit");
      expect(jobFitSource).toBe("curated");
      expect(modules.length).toBeGreaterThanOrEqual(47);
      const jf = modules.filter((m) => jobFit.includes(m.code));
      expect(jf).toHaveLength(3);
    },
  );
});

describe("resolveAssessmentModuleSet — blueprint majors", () => {
  test.each(BLUEPRINT_MAJORS)("'%s' → full catalog (47+ modules)", (spec) => {
    const { modules, mode, jobFitSource } = resolveAssessmentModuleSet(spec);
    expect(mode).toBe("universal-plus-jobfit");
    expect(jobFitSource).toBe("curated");
    expect(modules.length).toBeGreaterThanOrEqual(47);
    const jobFit = modules.filter((m) => m.specialization !== null);
    expect(jobFit.length).toBeGreaterThanOrEqual(3);
  });
});
