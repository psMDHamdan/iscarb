import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { ensureAttemptExamGeneration } from "@/lib/assessment/attempt-exam-generator";

export const POST = guard({ tier: "read", roles: ["student"] }, async (req, ctx) => {
  const { studentId } = ctx.session;

  if (!studentId) {
    return NextResponse.json({ success: false, error: "No student ID found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { name, program } = body;

    // Get current student to check if program is changing
    const currentStudent = await db.student.findUnique({
      where: { id: studentId },
      select: { program: true },
    });

    if (!currentStudent) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: {
        ...(name && { name }),
        ...(program && { program }),
      },
    });

    // If the specialization/program was just set or changed, trigger exam generation in the background!
    const isGenericProgram = (v: string) => {
      const t = v.trim().toLowerCase();
      return !t || t === "undeclared" || t === "general" || t === "general studies" || t === "n/a" || t === "none" || t === "other";
    };

    if (program && program !== currentStudent.program && !isGenericProgram(program)) {
      // Run non-blocking so we return the API response immediately
      ensureAttemptExamGeneration({
        studentId,
        specialization: program,
      }).catch(err => {
        console.error("Background exam generation failed:", err);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        studentId: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        specialty: updatedStudent.program,
      },
    });
  } catch (error) {
    console.error("Failed to update profile", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
