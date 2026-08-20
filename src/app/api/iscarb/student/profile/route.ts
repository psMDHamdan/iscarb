import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { db } from "@/lib/db";

export const GET = guard({ tier: "read", roles: ["student"] }, async (_req, ctx) => {
  const { studentId } = ctx.session;

  if (!studentId) {
    return NextResponse.json({ success: false, error: "No student ID found" }, { status: 404 });
  }

  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true, program: true },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        studentId: student.id,
        name: student.name,
        email: student.email,
        specialty: student.program,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
