import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const GET = async () => {
    try {
      const university = await db.university.findFirst({ orderBy: { createdAt: 'desc' } });
      const course = await db.course.findFirst({ orderBy: { createdAt: 'desc' } });
      const student = await db.student.findFirst({ orderBy: { createdAt: 'desc' } });
      const assessment = await db.assessmentResponse.findFirst({ orderBy: { createdAt: 'desc' } });
      const enrollment = await db.enrollment.findFirst({ orderBy: { createdAt: 'desc' } });

      return NextResponse.json({
        "University": university?.id || "",
        "Course": course?.id || "",
        "Student": student?.id || "",
        "AssessmentResponse": assessment?.id || "",
        "Enrollment": enrollment?.id || "",
      });
    } catch (e: any) {
      return NextResponse.json({}, { status: 500 });
    }
};
