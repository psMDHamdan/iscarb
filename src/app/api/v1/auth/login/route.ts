import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, type Role, signSessionJwt } from "@/lib/auth";
import { AuthService } from "@/services/identity/AuthService";
import { db } from "@/lib/db";

const LANDING: Partial<Record<Role, string>> = {
  student: "/assessment/employability",
  faculty: "/faculty/lecture",
  dean: "/coming-soon",
  admin: "/coming-soon",
  recruiter: "/coming-soon",
  system: "/coming-soon",
};

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string; password?: string } = {};
    try {
      body = await req.json();
    } catch {
      /* fall through to validation */
    }

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { user, token } = await AuthService.login(email, password, ipAddress, userAgent);

    const extractedRole = (user.userRoles?.[0]?.role?.name || user.role || "student") as string;
    const role = extractedRole.toLowerCase().replace(/\s+/g, '_') as Role;

    // Check if MFA is enabled
    const mfaSettings = await db.mfaSettings.findUnique({ where: { userId: user.id } });
    const isMfaEnabled = mfaSettings?.totpEnabled || mfaSettings?.smsEnabled;

    if (isMfaEnabled) {
      // In a real application, you'd issue a short-lived 'pre-auth' token here
      // and prompt the frontend to redirect to an MFA challenge screen.
      // We will issue the token but with `mfaVerified: false`.
      const preAuthToken = await signSessionJwt({
        sub: user.id,
        role,
        universityId: user.universityId ?? null,
        universityCode: null,
        studentId: null,
      }, 5 * 60, ipAddress, userAgent, false); // 5 minutes pre-auth

      return NextResponse.json({
        mfaRequired: true,
        methods: ['totp'],
        preAuthToken
      }, { status: 202 });
    }
    
    // Comprehensive landing page map
    const landingMap: Record<string, string> = {
      ...LANDING,
      university_admin: "/coming-soon",
      system_admin: "/coming-soon",
      super_admin: "/coming-soon",
      it_ops: "/coming-soon",
      developer: "/coming-soon",
      alumni: "/coming-soon",
      researcher: "/coming-soon",
      employer: "/coming-soon",
      partner: "/coming-soon",
      auditor: "/coming-soon",
    };

    const res = NextResponse.json({ role, token, landing: landingMap[role] ?? "/" });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || "Login failed. Please try again." }, { status: error.message === 'Invalid credentials' ? 401 : 500 });
  }
}
