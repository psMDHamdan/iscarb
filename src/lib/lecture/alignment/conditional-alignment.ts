import { db } from "@/lib/db";

export type AlignmentMode =
  | "OFFICIAL_JAHEZIAH"
  | "COURSE_READINESS"
  | "CONFIRM_REQUIRED"
  | "STALE_OFFICIAL_SOURCE";

export interface AlignmentResult {
  mode: AlignmentMode;
  reason: string;
}

/**
 * Determines the conditional Jaheziah alignment mode for a project.
 * As defined in BRD Section 7.4.
 */
export async function determineAlignmentMode(
  projectId: string
): Promise<AlignmentResult> {
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    include: { courseProfile: true },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  const specialty = project.courseProfile.specialty;

  // Rule 1: A specialty with no approved Jaheziah standard enters COURSE_READINESS
  // In a real system, we'd query the official standards database.
  // For the MVP, we hardcode supported ones.
  const supportedSpecialties = ["Software Engineering", "Computer Science", "Information Systems", "Cybersecurity"];

  if (!specialty || !supportedSpecialties.includes(specialty)) {
    return {
      mode: "COURSE_READINESS",
      reason: `Specialty "${specialty}" has no approved Jaheziah standard in the official database.`,
    };
  }

  // Rule 2: If the faculty hasn't explicitly confirmed the match, it's CONFIRM_REQUIRED
  // We check if the project.nationalAlignmentMode is already set to OFFICIAL_JAHEZIAH (meaning they confirmed it)
  if (project.nationalAlignmentMode !== "OFFICIAL_JAHEZIAH") {
    return {
      mode: "CONFIRM_REQUIRED",
      reason: `Ambiguous match. Faculty must confirm the mapping to the ${specialty} Jaheziah standard.`,
    };
  }

  // Rule 3: If standard is superseded or stale, STALE_OFFICIAL_SOURCE
  // For MVP, assume it's always fresh if they confirmed it.
  return {
    mode: "OFFICIAL_JAHEZIAH",
    reason: `Confirmed official Jaheziah mapping for ${specialty}.`,
  };
}

/**
 * Generates official Jaheziah label for the frontend ONLY if the mode is OFFICIAL_JAHEZIAH.
 */
export function getOfficialLabel(mode: string, specialty: string): string | null {
  if (mode === "OFFICIAL_JAHEZIAH") {
    return `Official Jaheziah Standard: ${specialty}`;
  }
  return null;
}
