/**
 * Lecture Generation — Vision 2030 context fetcher (TASK-04 §E).
 * ===========================================================================
 * Searches AuthoritativeSourceSnapshot for the vision2030 source, ranks each
 * project/strategy's relevance to the lecture topic via chatJson, and returns
 * the top 3 contexts. Any derived opportunity is labeled "system-suggested"
 * (FR-007, AC-18).
 */
import { db } from "@/lib/db";
import { chatJson } from "@/lib/ai-engine";
import { recordModelRun } from "./model-run";
import type { LectureVisionContext } from "@prisma/client";

const MODEL = "nvidia/nemotron-3-nano-30b-a3b";
const VISION_SOURCE_KEY = "vision2030";
const TOP_N = 3;

interface VisionCandidate {
  id: string;
  title: string;
  kind: string;
  officialUrl: string;
  description: string;
  relatedPrograms: string[];
}

const DEFAULT_VISION_CANDIDATES: VisionCandidate[] = [
  {
    id: "hstp",
    title: "Health Sector Transformation Program",
    kind: "program",
    officialUrl: "https://www.vision2030.gov.sa/en/v2030/v-programs/hstp/",
    description: "Transform healthcare delivery in the Kingdom through advanced biotechnology, genomic medicine, precision therapeutics, and health innovation.",
    relatedPrograms: ["Vision 2030 Pillar 1: A Vibrant Society", "Saudi Genome Project"],
  },
  {
    id: "hcdp",
    title: "Human Capability Development Program (HCDP)",
    kind: "program",
    officialUrl: "https://www.vision2030.gov.sa/en/v2030/v-programs/hcdp/",
    description: "Build global competitiveness of Saudi citizens by instilling values and developing knowledge, future STEM skills, and innovation capacity across all education stages.",
    relatedPrograms: ["Vision 2030 Pillar 3: An Ambitious Nation", "National Qualifications Framework"],
  },
  {
    id: "rdia-bio",
    title: "RDIA National RDI Priority: Health & Wellness (Biotechnology)",
    kind: "program",
    officialUrl: "https://rdia.gov.sa/en/priorities/health.html",
    description: "Position Saudi Arabia as a regional hub for genomic medicine, gene editing research (CRISPR), bio-pharmaceutical development, and advanced disease treatment.",
    relatedPrograms: ["Vision 2030 Pillar 2: A Thriving Economy", "KACST Biotechnology Strategy"],
  },
];

export async function fetchVisionContexts(
  projectId: string,
  specialty: string,
  lectureTopic: string
): Promise<Omit<LectureVisionContext, "id" | "organizationId" | "projectId" | "approved">[]> {
  // AC-17: only APPROVED official snapshots may feed product surfaces.
  const snapshots = await db.authoritativeSourceSnapshot.findMany({
    where: { sourceKey: VISION_SOURCE_KEY, approvalStatus: "approved" },
    select: { contentText: true, url: true },
    orderBy: { retrievedAt: "desc" },
  });

  if (snapshots.length === 0) {
    return [];
  }
  const candidates = parseVisionCandidates(snapshots);
  if (candidates.length === 0) {
    return [];
  }

  // Rank relevance of each candidate to the lecture topic.
  const ranked = await rankCandidates(candidates, specialty, lectureTopic, projectId);
  const top = ranked.slice(0, TOP_N);

  return top.map((c) => ({
    title: c.title,
    kind: c.kind,
    officialUrl: c.officialUrl,
    description: c.description,
    relatedPrograms: c.relatedPrograms,
    retrievedAt: new Date(),
    derivedOpportunityLabel: "system-suggested",
  }));
}

/** Split the snapshot text into coarse vision items (heading + description). */
function parseVisionCandidates(snapshots: { contentText: string; url: string }[]): VisionCandidate[] {
  const candidates: VisionCandidate[] = [];
  for (const snapshot of snapshots) {
    const lines = snapshot.contentText.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const [title, ...rest] = line.split("|");
      if (!title) continue;
      candidates.push({
        id: candidates.length.toString(),
        title: title.trim(),
        kind: line.includes("program") ? "program" : "project",
        officialUrl: snapshot.url ?? "",
        description: rest.join(" | ").trim(),
        relatedPrograms: [],
      });
    }
  }
  return candidates;
}

async function rankCandidates(
  candidates: VisionCandidate[],
  specialty: string,
  lectureTopic: string,
  projectId: string
): Promise<VisionCandidate[]> {
  const system = "You are a relevance ranker. Given a lecture topic and a list of Vision 2030 initiatives, return the indices of the top 3 most relevant, ordered best first. Return STRICT JSON: { \"topIndices\": [0,2,1] }";
  const user = [
    `Specialty: ${specialty}`,
    `Lecture topic: ${lectureTopic}`,
    candidates.map((c, i) => `${i}. ${c.title} — ${c.description}`).join("\n"),
  ].join("\n");

  try {
    const result = await chatJson({ system, user, temperature: 0.2, model: MODEL });
    await recordModelRun({ projectId, kind: "vision", result });
    const json = result.json as Record<string, unknown> | null;
    if (!json || (json as any).fallback === true) return candidates.slice(0, TOP_N);
    const indices = (json as { topIndices?: number[] }).topIndices;
    if (!Array.isArray(indices)) return candidates.slice(0, TOP_N);
    const valid = indices.map(Number).filter((i) => candidates[i]).map((i) => candidates[i]);
    return valid.length > 0 ? valid : candidates.slice(0, TOP_N);
  } catch {
    return candidates.slice(0, TOP_N);
  }
}
