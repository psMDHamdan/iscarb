import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/identity/AuthService";
import { SESSION_COOKIE } from "@/lib/auth";
import { canonicalSpecializationLabel } from "@/lib/assessment";
import { enqueueSignupJobFitGeneration } from "@/lib/assessment/jobfit-signup-enqueue";
import { enqueueSignupExamGeneration } from "@/lib/assessment/attempt-exam-generator";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    organizationId?: string;
    specialty?: string;
    specialization?: string;
    program?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    /* fall through to validation */
  }
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const password = body.password || "";
  // Optional FK: empty/missing must be null, not "" (FK violation on User.organizationId).
  const organizationId = body.organizationId || null;

  const rawSpecialty = (body.specialty || body.specialization || body.program || "").trim();
  const specialty = canonicalSpecializationLabel(rawSpecialty);

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }
  if (!specialty) {
    return NextResponse.json({ error: "Specialty / major is required" }, { status: 400 });
  }

  try {
    await AuthService.signup({
      email,
      name: name || email.split("@")[0],
      passwordRaw: password,
      organizationId,
      program: specialty,
    });

    // Phase 5: generate uncurated Job-Fit into the bank in the background
    // (never at exam time). Idempotent; curated tracks are no-ops.
    enqueueSignupJobFitGeneration(specialty);

    const created = await db.user.findUnique({
      where: { email },
      select: { id: true, student: { select: { id: true } } },
    });
    if (created?.student?.id) {
      // Await so the QStash job is durably queued before the signup response
      // returns — generation itself runs in the background worker.
      await enqueueSignupExamGeneration(created.student.id, specialty);
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.ip || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Login immediately — Student already exists with specialty from signup
    const { token } = await AuthService.login(email, password, ipAddress, userAgent);

    const res = NextResponse.json(
      { role: "student", landing: "/assessment/employability", specialty },
      { status: 201 },
    );
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Email already registered' ? 409 : 400 });
  }
}
