/**
 * Student Lecture — assessment answer check (HIDDEN ANSWER ARCHITECTURE).
 * ===========================================================================
 * POST /api/iscarb/lecture/experience/[id]/assess
 * Body: { assessmentId, optionId }
 * Response: { correct: boolean, correctOptionId: string }
 *
 * The correct answer lives ONLY on the server (LectureReadinessItem.correctIndex
 * for the legacy artifact path, AssessmentItem.correctOptionId for the canonical
 * learning-experience path). The student client never receives it — it is
 * revealed strictly AFTER the student submits an answer (FR-021 reveal-after-
 * answer). Instructor rationale is never returned to students.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";

interface AssessBody {
  assessmentId: string;
  optionId: string;
}

export const POST = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id: experienceId } = await params;
    const tenantId = ctx.session.universityId || "default";

    let body: AssessBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { assessmentId, optionId } = body;
    if (!assessmentId || !optionId) {
      return NextResponse.json(
        { error: "assessmentId and optionId are required" },
        { status: 400 }
      );
    }

    const rawId = String(assessmentId).replace(/^assess-/, "");

    // ── Path 1: legacy artifact-backed assessment (assess-<artifactId>) ──
    const artifact = await db.lectureSlideArtifact.findFirst({
      where: { id: rawId },
      select: { projectId: true, slideNo: true },
    });

    if (artifact) {
      const project = await db.lectureProject.findFirst({
        where: { id: artifact.projectId },
        select: { tenantId: true },
      });
      if (project && project.tenantId && project.tenantId !== tenantId && tenantId !== "default") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const item = await db.lectureReadinessItem.findFirst({
        where: { projectId: artifact.projectId, slideNo: artifact.slideNo, approved: true },
        select: { correctIndex: true },
      });
      if (!item) {
        return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
      }

      // optionId is "opt-<index>" in the student projection.
      const idxMatch = String(optionId).match(/^opt-(\d+)$/);
      if (!idxMatch) {
        return NextResponse.json({ error: "Invalid option id" }, { status: 400 });
      }
      const chosen = Number(idxMatch[1]);
      const correct = chosen === item.correctIndex;

      return NextResponse.json(
        { correct, correctOptionId: `opt-${item.correctIndex}` },
        { status: 200 }
      );
    }

    // ── Path 2: canonical LearningExperience AssessmentItem ──
    const assessment = await db.assessmentItem.findUnique({
      where: { id: rawId },
      select: { experienceId: true, correctOptionId: true },
    });
    if (assessment) {
      const experience = await db.learningExperience.findUnique({
        where: { id: assessment.experienceId },
        select: { tenantId: true, id: true },
      });
      if (experience && experience.tenantId && experience.tenantId !== tenantId && tenantId !== "default") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      // The assessment must belong to the requested experience (or its project).
      if (experience?.id !== experienceId && experienceId !== experience?.id) {
        const projMatch = await db.learningExperience.findFirst({
          where: { id: experienceId, OR: [{ id: experience.id }, { projectId: experienceId }] },
          select: { id: true },
        });
        if (!projMatch) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      }

      return NextResponse.json(
        { correct: String(optionId) === assessment.correctOptionId, correctOptionId: assessment.correctOptionId },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }
);
