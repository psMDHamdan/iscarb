/**
 * Phase 1: Calibration Session API
 * Section 7.4 - Faculty rubric calibration endpoints
 *
 * Endpoints:
 * - GET /api/iscarb/assessment/calibration/[id] - Get session details
 * - POST /api/iscarb/assessment/calibration/[id]/scores - Submit reviewer scores
 * - PUT /api/iscarb/assessment/calibration/[id]/rubric - Apply rubric adjustments
 */

import { NextRequest, NextResponse } from 'next/server';
import { guard } from '@/lib/api-guard';
import { db } from '@/lib/db';
import { rdfSyncService } from "@/services/rdf/rdf-sync.service";

export const GET = guard(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const sessionId = params.id;

  // Fetch calibration session
  const session = await db.calibrationSession.findUnique({
    where: { id: sessionId },
    include: {
      assessment: {
        include: { rubric: true },
      },
      reviewers: true,
      sampleSubmission: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(session);
});

export const POST = guard(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const sessionId = params.id;
  const __parsedBody = await parseJSON(req);
  if (!__parsedBody) return jsonErrorResponse("Invalid request body");
  const { reviewerId, scores } = __parsedBody as any;

  // Validate reviewer belongs to this session
  const session = await db.calibrationSession.findUnique({
    where: { id: sessionId },
    include: { reviewers: true },
  });

  if (!session || !session.reviewers.some(r => r.id === reviewerId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Record reviewer scores
  const updatedSession = await db.calibrationSession.update({
    where: { id: sessionId },
    data: {
      reviewers: {
        update: {
          where: { id: reviewerId },
          data: {
            scores,
            submitted: true,
          },
        },
      },
    },
  });

  
      
      // RDF sync
      rdfSyncService.insertEntity("CalibrationSession", "unknown", "ISCARB", data).catch(() => {});// RDF sync
      rdfSyncService.insertEntity("CalibrationSession", updatedSession.id, "ISCARB", updatedSession).catch(() => {});return NextResponse.json(updatedSession);
});

export const PUT = guard(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const sessionId = params.id;
  const __parsedBody = await parseJSON(req);
  if (!__parsedBody) return jsonErrorResponse("Invalid request body");
  const { adjustedRubric } = __parsedBody as any;

  // Only facilitator can apply adjustments
  const session = await db.calibrationSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Apply rubric adjustments to assessment
  const updatedAssessment = await db.assessment.update({
    where: { id: session.assessmentId },
    data: {
      rubric: adjustedRubric,
      updatedAt: new Date(),
    },
  });

  
      
      // RDF sync
      rdfSyncService.insertEntity("Assessment", "unknown", "ISCARB", data).catch(() => {});// RDF sync
      rdfSyncService.insertEntity("Assessment", updatedAssessment.id, "ISCARB", updatedAssessment).catch(() => {});// Mark calibration as complete
  const completedSession = await db.calibrationSession.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });

  
      
      // RDF sync
      rdfSyncService.insertEntity("CalibrationSession", "unknown", "ISCARB", data).catch(() => {});// RDF sync
      rdfSyncService.insertEntity("CalibrationSession", completedSession.id, "ISCARB", completedSession).catch(() => {});return NextResponse.json({
    session: completedSession,
    assessment: updatedAssessment,
  });
});
