/**
 * Student Session API — get/create the active learning session.
 * ===========================================================================
 * GET  /api/iscarb/lecture/experience/[id]/session  → existing session + resume point
 * POST /api/iscarb/lecture/experience/[id]/session  → create-or-get (upsert)
 * PATCH /api/iscarb/lecture/experience/[id]/session → persist progress/interactions
 *
 * Session rows back server-side resume and analytics; mastery is computed
 * server-side (spec: server-computed mastery + gated final challenge).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import {
  getOrCreateSession,
  recordInteraction,
  updateProgress,
  computeMastery,
  finalChallengeUnlocked,
} from "@/lib/lecture/session/session-service";

interface SessionBody {
  currentBlockIndex?: number;
  currentStage?: string;
  completedStageKeys?: string[];
  interaction?: {
    conceptBlockId: string;
    activityType: string;
    studentInput?: string;
    selectedOptionId?: string;
    isCorrect?: boolean;
    confidenceLevel?: string;
    hintsRequested?: number;
    timeSpentSeconds?: number;
    evaluatedMasteryScore?: number;
  };
}

function toExperienceId(id: string): Promise<string | null> {
  return db.learningExperience
    .findFirst({
      where: { OR: [{ id }, { projectId: id }] },
      orderBy: { version: "desc" },
      select: { id: true },
    })
    .then((r: { id: string } | null) => r?.id ?? null);
}

export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (_req, ctx: GuardContext, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const studentId = ctx.session.studentId ?? ctx.session.userId;
    if (!studentId) {
      return NextResponse.json({ error: "AUTH_IDENTITY_REQUIRED", message: "No student identity on this session." }, { status: 401 });
    }

    const experienceId = await toExperienceId(id);
    if (!experienceId) {
      return NextResponse.json({ error: "NOT_GENERATED", message: "No learning experience exists for this lecture yet." }, { status: 404 });
    }

    const session = await getOrCreateSession(experienceId, studentId);
    if (!session) {
      return NextResponse.json({ error: "SESSION_UNAVAILABLE" }, { status: 500 });
    }

    const unlocked = await finalChallengeUnlocked(session.id);

    return NextResponse.json({
      sessionId: session.id,
      resume: {
        currentBlockIndex: session.currentBlockIndex,
        currentStage: session.currentStage,
        completedStageKeys: session.completedStageKeys || [],
      },
      masteryPercent: session.masteryPercent,
      finalChallengeUnlocked: unlocked,
      experienceId,
    });
  }
);

export const POST = GET;

export const PATCH = guard(
  { tier: "write", roles: ["student", "faculty", "admin"] },
  async (req, ctx: GuardContext, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const studentId = ctx.session.studentId ?? ctx.session.userId;
    if (!studentId) {
      return NextResponse.json({ error: "AUTH_IDENTITY_REQUIRED" }, { status: 401 });
    }

    let body: SessionBody;
    try {
      body = (await req.json()) as SessionBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const experienceId = await toExperienceId(id);
    if (!experienceId) {
      return NextResponse.json({ error: "NOT_GENERATED" }, { status: 404 });
    }

    const session = await getOrCreateSession(experienceId, studentId);
    if (!session) return NextResponse.json({ error: "SESSION_UNAVAILABLE" }, { status: 500 });

    // 1. Persist progress position + completed stages.
    if (body.currentBlockIndex != null || body.currentStage || body.completedStageKeys) {
      await updateProgress(session.id, {
        currentBlockIndex: body.currentBlockIndex,
        currentStage: body.currentStage,
        completedStageKeys: body.completedStageKeys,
      });
    }

    // 2. Persist a single interaction if provided.
    if (body.interaction) {
      await recordInteraction({
        sessionId: session.id,
        conceptBlockId: body.interaction.conceptBlockId,
        activityType: body.interaction.activityType,
        studentInput: body.interaction.studentInput ?? "",
        selectedOptionId: body.interaction.selectedOptionId,
        isCorrect: body.interaction.isCorrect,
        confidenceLevel: body.interaction.confidenceLevel,
        hintsRequested: body.interaction.hintsRequested,
        timeSpentSeconds: body.interaction.timeSpentSeconds,
        evaluatedMasteryScore: body.interaction.evaluatedMasteryScore,
      });
    }

    // 3. Recompute mastery server-side.
    const mastery = await computeMastery(session.id);
    const unlocked = await finalChallengeUnlocked(session.id);

    return NextResponse.json({
      sessionId: session.id,
      masteryPercent: mastery,
      finalChallengeUnlocked: unlocked,
    });
  }
);