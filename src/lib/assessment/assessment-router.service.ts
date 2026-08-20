// src/lib/assessment/assessment-router.service.ts
// Role-Based Assessment Routing & Visibility Engine
// Determines which assessments each user sees based on role, courses, and permissions

import { db } from '@/lib/db';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'faculty' | 'dean' | 'admin' | 'recruiter' | 'parent';

export interface AssessmentVisibility {
  assessmentId: string;
  title: string;
  type: 'employability' | 'quiz' | 'exam' | 'assignment' | 'coding' | 'viva' | 'practice';
  status: 'available' | 'locked' | 'completed' | 'overdue';
  dueDate?: Date;
  estimatedMinutes: number;
  progress: number; // 0-100
  canTake: boolean;
  canView: boolean;
  canEdit: boolean;
  canGrade: boolean;
}

export interface RouterContext {
  userId: string;
  role: UserRole;
  universityId: string;
  studentId?: string; // for parent viewing child
  specialization?: string;
  enrolledCourses?: string[];
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVICE
// ─────────────────────────────────────────────────────────────

export class AssessmentRouterService {

  /**
   * Get all visible assessments for a user
   */
  async getVisibleAssessments(context: RouterContext): Promise<AssessmentVisibility[]> {
    const { role, userId, universityId, studentId, specialization, enrolledCourses } = context;

    switch (role) {
      case 'student':
        return this.getStudentAssessments(userId, universityId, specialization, enrolledCourses);
      case 'faculty':
        return this.getFacultyAssessments(userId, universityId);
      case 'dean':
        return this.getDeanAssessments(universityId);
      case 'admin':
        return this.getAdminAssessments(universityId);
      case 'recruiter':
        return this.getRecruiterAssessments(universityId);
      case 'parent':
        return this.getParentAssessments(studentId!, universityId);
      default:
        return [];
    }
  }

  /**
   * STUDENT: See employability + enrolled course assessments + practice
   */
  private async getStudentAssessments(
    studentId: string,
    universityId: string,
    specialization?: string,
    enrolledCourses?: string[]
  ): Promise<AssessmentVisibility[]> {
    const visible: AssessmentVisibility[] = [];

    // 1. Employability assessments (always visible, all 47 modules)
    const employabilityModules = await this.getEmployabilityModules(studentId, specialization);
    visible.push(...employabilityModules);

    // 2. Course-based assessments (only for enrolled courses)
    if (enrolledCourses && enrolledCourses.length > 0) {
      const courseAssessments = await this.getCourseAssessments(studentId, enrolledCourses);
      visible.push(...courseAssessments);
    }

    // 3. Practice assessments (all available)
    const practiceAssessments = await this.getPracticeAssessments(universityId);
    visible.push(...practiceAssessments);

    return visible.sort((a, b) => {
      // Sort: overdue first, then by due date, then available
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      return 0;
    });
  }

  /**
   * FACULTY: See own course assessments + calibration sessions
   */
  private async getFacultyAssessments(
    facultyId: string,
    universityId: string
  ): Promise<AssessmentVisibility[]> {
    // Get assessments for courses taught by this faculty
    const taughtCourses = await db.course.findMany({
      where: { instructorId: facultyId, universityId },
      select: { id: true },
    });

    const courseIds = taughtCourses.map((c) => c.id);

    const assessments = await db.assessment.findMany({
      where: {
        universityId,
        OR: [
          { createdBy: facultyId },
          { courseId: { in: courseIds } },
        ],
      },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    return assessments.map((a) => ({
      assessmentId: a.id,
      title: a.title,
      type: a.type as any,
      status: a.status as any,
      dueDate: a.dueDate || undefined,
      estimatedMinutes: a.timeLimit || 30,
      progress: 0,
      canTake: false,
      canView: true,
      canEdit: true,
      canGrade: true,
    }));
  }

  /**
   * DEAN: See all assessments in college + analytics
   */
  private async getDeanAssessments(universityId: string): Promise<AssessmentVisibility[]> {
    const assessments = await db.assessment.findMany({
      where: { universityId },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        timeLimit: true,
        _count: { select: { submissions: true } },
      },
    });

    return assessments.map((a) => ({
      assessmentId: a.id,
      title: a.title,
      type: a.type as any,
      status: 'available',
      estimatedMinutes: a.timeLimit || 30,
      progress: 0,
      canTake: false,
      canView: true,
      canEdit: false,
      canGrade: false,
    }));
  }

  /**
   * RECRUITER: See only employability profiles (with consent)
   */
  private async getRecruiterAssessments(universityId: string): Promise<AssessmentVisibility[]> {
    // Recruiters don't see individual assessments
    // They see aggregated employability data with student consent
    return []; // Accessed via separate recruiter API
  }

  /**
   * PARENT: See child's employability + course progress
   */
  private async getParentAssessments(
    childStudentId: string,
    universityId: string
  ): Promise<AssessmentVisibility[]> {
    // Parents see simplified view of child's assessments
    const studentAssessments = await this.getStudentAssessments(childStudentId, universityId);

    // Filter to only show completed assessments and employability
    return studentAssessments.filter(
      (a) => a.type === 'employability' || a.status === 'completed'
    );
  }

  /**
   * ADMIN: Full access
   */
  private async getAdminAssessments(universityId: string): Promise<AssessmentVisibility[]> {
    return this.getDeanAssessments(universityId); // Same as dean for now
  }

  // ─────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────

  private async getEmployabilityModules(
    studentId: string,
    specialization?: string
  ): Promise<AssessmentVisibility[]> {
    // Get the employability modules from catalog
    const { modulesForSpecialization } = await import('@/lib/assessment/catalog');
    const result = modulesForSpecialization(specialization || 'Computer Science');
    const modules = result.modules;

    // Check which modules the student has completed
    const completedResponses = await db.assessmentResponse.findMany({
      where: { studentId },
      select: { moduleCode: true },
    });
    const completedCodes = new Set(completedResponses.map((r) => r.moduleCode));

    return modules.map((m) => ({
      assessmentId: m.code,
      title: m.title,
      type: 'employability' as const,
      status: completedCodes.has(m.code) ? 'completed' : 'available',
      estimatedMinutes: m.estimatedMinutes,
      progress: completedCodes.has(m.code) ? 100 : 0,
      canTake: !completedCodes.has(m.code),
      canView: true,
      canEdit: false,
      canGrade: false,
    }));
  }

  private async getCourseAssessments(
    studentId: string,
    courseIds: string[]
  ): Promise<AssessmentVisibility[]> {
    const assessments = await db.assessment.findMany({
      where: {
        courseId: { in: courseIds },
        status: { in: ['active', 'published'] },
      },
      include: {
        submissions: {
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return assessments.map((a) => {
      const latestSubmission = a.submissions[0];
      const isCompleted = latestSubmission?.status === 'submitted' || latestSubmission?.status === 'graded';
      const isOverdue = a.dueDate && new Date() > a.dueDate && !isCompleted;

      return {
        assessmentId: a.id,
        title: a.title,
        type: a.type as any,
        status: isOverdue ? 'overdue' : isCompleted ? 'completed' : 'available',
        dueDate: a.dueDate || undefined,
        estimatedMinutes: a.timeLimit || 30,
        progress: isCompleted ? 100 : 0,
        canTake: !isCompleted && !isOverdue,
        canView: true,
        canEdit: false,
        canGrade: false,
      };
    });
  }

  private async getPracticeAssessments(universityId: string): Promise<AssessmentVisibility[]> {
    const practiceAssessments = await db.assessment.findMany({
      where: {
        universityId,
        type: 'practice',
        status: 'active',
      },
    });

    return practiceAssessments.map((a) => ({
      assessmentId: a.id,
      title: a.title,
      type: 'practice' as const,
      status: 'available',
      estimatedMinutes: a.timeLimit || 30,
      progress: 0,
      canTake: true,
      canView: true,
      canEdit: false,
      canGrade: false,
    }));
  }

  /**
   * Check if a user can access a specific assessment
   */
  async canAccessAssessment(
    context: RouterContext,
    assessmentId: string
  ): Promise<{ canAccess: boolean; reason?: string }> {
    const visible = await this.getVisibleAssessments(context);
    const assessment = visible.find((a) => a.assessmentId === assessmentId);

    if (!assessment) {
      return { canAccess: false, reason: 'Assessment not found or not visible for your role.' };
    }

    if (!assessment.canTake && context.role === 'student') {
      return { canAccess: false, reason: 'You have already completed this assessment or it is not yet available.' };
    }

    return { canAccess: true };
  }
}

// Singleton export
export const assessmentRouter = new AssessmentRouterService();
