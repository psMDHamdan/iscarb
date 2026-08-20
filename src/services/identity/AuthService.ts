import bcrypt from 'bcrypt';
import { signSessionJwt, Role } from '../../lib/auth';
import { AuditService } from './AuditService';
import { db } from '@/lib/db';

export class AuthService {
  /**
   * Register a new user
   */
  static async signup(data: {
    email: string;
    passwordRaw: string;
    name: string;
    organizationId?: string | null;
    /** Canonical specialty / major stored on Student.program */
    program?: string | null;
  }) {
    // Hash password
    const password = await bcrypt.hash(data.passwordRaw, 10);
    
    // Check if email exists
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const rawRole = data.email.toLowerCase().includes('faculty') ? 'faculty' : 'student';

    // Public signups carry no university — land them in the platform's default
    // university so tenant-scoped content (published lectures, profiles, etc.)
    // is visible. Mirrors DEV_UNIVERSITY_CODE in src/lib/auth.ts.
    const DEFAULT_UNIVERSITY_CODE = process.env.ISCARB_DEFAULT_UNIVERSITY || 'KFU';
    const defaultUni = data.organizationId
      ? null
      : await db.university.findFirst({
          where: { code: DEFAULT_UNIVERSITY_CODE },
          select: { id: true },
        });
    const universityId = defaultUni?.id ?? null;

    const user = await db.user.create({
      data: {
        email: data.email,
        password,
        name: data.name,
        organizationId: data.organizationId || null,
        universityId,
        role: rawRole,
      },
    });

    // Also link the proper Role entity
    const roleEntity = await db.role.findFirst({ where: { name: rawRole === 'faculty' ? 'Faculty' : 'Student' } });
    if (roleEntity) {
      await db.userRole.create({
        data: {
          userId: user.id,
          roleId: roleEntity.id,
        },
      });
    }

    const program = (data.program || "").trim() || "Undeclared";

    // Create Student immediately so specialty is set before first exam load.
    await db.student.create({
      data: {
        email: data.email,
        name: data.name,
        userId: user.id,
        universityId: user.universityId,
        college: "Undeclared",
        program,
        cohort: new Date().getFullYear().toString(),
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: 'USER_SIGNUP',
      entityType: 'User',
      entityId: user.id,
      category: 'user_management',
      severity: 'info',
      organizationId: data.organizationId || undefined,
    });

    return user;
  }

  /**
   * Login user and issue JWT
   */
  static async login(email: string, passwordRaw: string, ipAddress?: string, userAgent?: string) {
    const user = await db.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      try {
        await this.signup({
          email,
          passwordRaw,
          name: email.split('@')[0],
        });
        return this.login(email, passwordRaw, ipAddress, userAgent);
      } catch (signupErr) {
        await this.logAttempt(email, undefined, false, 'invalid_credentials', ipAddress, userAgent);
        throw new Error('Invalid credentials');
      }
    }

    if (!user.password) {
      await this.logAttempt(email, user.id, false, 'invalid_credentials', ipAddress, userAgent);
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(passwordRaw, user.password);
    
    if (!isValid) {
      await this.logAttempt(email, user.id, false, 'invalid_credentials', ipAddress, userAgent);
      throw new Error('Invalid credentials');
    }

    // Resolve linked Student record so ownership checks have a studentId claim.
    const rawRole = (user.userRoles?.[0]?.role?.name || user.role || 'student') as string;
    const role = rawRole.toLowerCase().replace(/\s+/g, '_') as Role;
    let studentId: string | null = null;
    if (role === "student") {
      let linked = await db.student.findFirst({
        where: { userId: user.id },
        select: { id: true, userId: true, email: true },
      });
      if (!linked) {
        linked = await db.student.findFirst({
          where: { email: user.email },
          select: { id: true, userId: true, email: true },
        });
        if (linked && !linked.userId) {
          await db.student.update({
            where: { id: linked.id },
            data: { userId: user.id },
          });
        }
      }
      // Auto-create a Student record if none exists for this student user.
      // This ensures the JWT always carries a studentId after login.
      // The Student model requires: name, email, college, program, cohort.
      if (!linked) {
        const email = user.email ?? `student-${user.id}@iscarb.local`;
        const displayName = user.name || email.split("@")[0];
        try {
          linked = await db.student.create({
            data: {
              email,
              name: displayName,
              userId: user.id,
              universityId: user.universityId,
              college: "Undeclared",
              program: "Undeclared",
              cohort: new Date().getFullYear().toString(),
            },
            select: { id: true, userId: true, email: true },
          });
        } catch (createErr) {
          console.error("Failed to auto-create Student record for user", user.id, createErr);
          // If creation fails, login still succeeds — studentId stays null
        }
      }
      studentId = linked?.id ?? null;
    }

    // Generate token
    const token = await signSessionJwt({
      sub: user.id,
      role,
      universityId: user.universityId,
      organizationId: user.organizationId,
      studentId,
    });

    await this.logAttempt(email, user.id, true, null, ipAddress, userAgent);

    await AuditService.log({
      actorId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      category: 'authentication',
      severity: 'info',
      organizationId: user.organizationId || undefined,
      ipAddress,
      userAgent,
    });

    return { user, token };
  }

  private static async logAttempt(
    email: string, 
    userId: string | undefined, 
    success: boolean, 
    failureReason: string | null,
    ipAddress?: string,
    userAgent?: string
  ) {
    await db.loginAttempt.create({
      data: {
        email,
        userId,
        success,
        failureReason,
        ipAddress,
        userAgent,
        method: 'password'
      }
    });
  }
}
