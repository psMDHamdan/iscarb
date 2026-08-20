import { UNIVERSAL_MODULES } from "../catalog";

const TRACKS = [
  "Digital Marketing",
  "Business Development",
  "Project Management",
  "Data Analysis",
  "Human Resources",
  "Web Development",
];

describe("Level-3 specialization assignment", () => {
  const level3 = UNIVERSAL_MODULES.filter(m => m.level.startsWith("L3-"));

  test("there are 18 Level-3 modules (M21-M38)", () => {
    expect(level3).toHaveLength(18);
  });

  test.each(level3.map(m => [m.code, m]))(
    "module %s has non-null specialization and dimension job_fit",
    (_code, m) => {
      expect(m.specialization).toBeTruthy();
      expect(m.dimension).toBe("job_fit");
    }
  );
});

describe("Level-3 discovery round-trip", () => {
  test.each(TRACKS)("track '%s' resolves all its modules", (track) => {
    const byTrack = UNIVERSAL_MODULES.filter(m => m.specialization === track);
    const level3ForTrack = UNIVERSAL_MODULES.filter(
      m => m.level.startsWith("L3-") && m.specialization === track
    );
    expect(byTrack.length).toBeGreaterThan(0);
    for (const m of level3ForTrack) {
      expect(byTrack.find(x => x.code === m.code)).toBeDefined();
    }
  });
});
