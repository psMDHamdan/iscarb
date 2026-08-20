import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { bandFor } from "@/lib/assessment/framework";

export async function GET(req: NextRequest) {
  const g = await guard(req, "assessment:review:read");
  if (!g.ok) {
    return NextResponse.json({ error: g.error }, { status: g.status });
  }

  try {
    // Fetch pending manual reviews (validationPassed === false)
    const pending = await db.assessmentResponse.findMany({
      where: {
        universityId: g.tenantId || undefined,
        validationPassed: false,
      },
      include: {
        student: {
          select: { name: true, studentId: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = pending.map((p) => ({
      id: p.id,
      studentName: p.student?.name || "Unknown",
      studentId: p.student?.studentId || p.studentId,
      assessmentTitle: p.moduleCode,
      submittedAt: p.createdAt.toISOString(),
      status: "pending",
      content: p.rawResponse || "",
      aiScore: p.score,
      rubric: JSON.parse(p.perCriterionJson || "[]"),
      feedback: p.feedback,
      strengths: JSON.parse(p.strengthsJson || "[]"),
      improvements: JSON.parse(p.improvementsJson || "[]"),
    }));

    return NextResponse.json({ submissions: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(req, "assessment:review:write");
  if (!g.ok) {
    return NextResponse.json({ error: g.error }, { status: g.status });
  }

  try {
    const body = await req.json();
    const { responseId, approved, newScore, newFeedback, newRubric } = body;

    if (!responseId) {
      return NextResponse.json({ error: "Missing responseId" }, { status: 400 });
    }

    const current = await db.assessmentResponse.findUnique({
      where: { id: responseId }
    });

    if (!current) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }
    
    // Ensure tenant isolation
    if (g.tenantId && current.universityId !== g.tenantId) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!approved) {
      // Just mark validationPassed = true to clear the queue
      await db.assessmentResponse.update({
        where: { id: responseId },
        data: { validationPassed: true } 
      });
      return NextResponse.json({ success: true, action: "rejected" });
    }

    const band = bandFor(newScore).id;

    // Update with new score
    const updated = await db.assessmentResponse.update({
      where: { id: responseId },
      data: {
        score: newScore,
        band: band,
        passed: newScore >= 60,
        feedback: newFeedback,
        perCriterionJson: JSON.stringify(newRubric),
        validationPassed: true, // Marked as reviewed
        source: "manual-faculty",
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
