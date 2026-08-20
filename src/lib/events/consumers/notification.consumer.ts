/**
 * Notification Consumer
 * ===========================================================================
 * Handles all events that trigger student/faculty notifications.
 * ===========================================================================
 */
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PlatformEvent } from "@/lib/event-bus";

export async function handleAssessmentCompleted(event: PlatformEvent): Promise<void> {
  const { studentId, assessmentId, score } = event as any;

  logger.info({ studentId, assessmentId }, "notification: assessment completed");

  await db.notification.create({
    data: {
      studentId,
      type: "assessment",
      titleEn: "Assessment Completed",
      titleAr: "تم إكمال التقييم",
      bodyEn: `Your assessment has been scored: ${score}`,
      bodyAr: `تم تقييم تقييمك: ${score}`,
      metaJson: JSON.stringify({ assessmentId, score }),
    },
  });
}

export async function handleScoreAdjusted(event: PlatformEvent): Promise<void> {
  const { studentId, assessmentId, newScore, oldScore } = event as any;

  logger.info({ studentId, assessmentId }, "notification: score adjusted");

  await db.notification.create({
    data: {
      studentId,
      type: "assessment",
      titleEn: "Score Updated",
      titleAr: "تم تحديث الدرجة",
      bodyEn: `Your assessment score has been updated from ${oldScore} to ${newScore}`,
      bodyAr: `تم تحديث درجة التقييم من ${oldScore} إلى ${newScore}`,
      metaJson: JSON.stringify({ assessmentId, oldScore, newScore }),
    },
  });
}

export async function handleReviewCompleted(event: PlatformEvent): Promise<void> {
  const { studentId, submissionId } = event as any;

  logger.info({ studentId, submissionId }, "notification: review completed");

  await db.notification.create({
    data: {
      studentId,
      type: "assessment",
      titleEn: "Review Completed",
      titleAr: "تم المراجعة",
      bodyEn: "Your submission has been reviewed by a faculty member.",
      bodyAr: "تمت مراجعة تسليمك من قبل عضو هيئة التدريس.",
      metaJson: JSON.stringify({ submissionId }),
    },
  });
}
