// PDF Export API Endpoint
// GET /api/assessment/[id]/export-pdf
// src/app/api/assessment/[id]/export-pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateAssessmentPDF, generatePDFFilename } from '@/services/pdf-generator.service';
import { db } from '@/lib/db';
import { rdfSyncService } from "@/services/rdf/rdf-sync.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get assessment/submission
    const submission = await db.assessmentSubmission.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        candidateId: true,
        score: true,
        confidenceScore: true,
        feedback: true,
        strengths: true,
        improvements: true,
        dimensionalScores: true,
        createdAt: true,
        assessment: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                title: true,
              },
            },
          },
        },
        candidate: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // 3. Verify user owns this submission (student) or is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (user?.role !== 'admin' && user?.id !== submission.candidateId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 4. Get per-criterion scores from evaluation logs
    const evaluationLogs = await db.aiEvaluationLog.findMany({
      where: { submissionId: params.id },
      select: {
        criterionName: true,
        scoreGiven: true,
        maxScore: true,
        weight: true,
        reasoning: true,
      },
    });

    // 5. Generate PDF
    const pdfBuffer = await generateAssessmentPDF({
      studentName: `${submission.candidate.firstName} ${submission.candidate.lastName}`,
      assessmentTitle: submission.assessment.title,
      date: submission.createdAt,
      score: submission.score || 0,
      confidenceScore: submission.confidenceScore || 0,
      feedback: submission.feedback || 'No feedback available',
      perCriterion: evaluationLogs.map((log) => ({
        criterion: log.criterionName,
        scoreGiven: log.scoreGiven,
        maxScore: log.maxScore,
        weight: log.weight,
        reasoning: log.reasoning,
      })),
      strengths: Array.isArray(submission.strengths)
        ? submission.strengths
        : [],
      improvements: Array.isArray(submission.improvements)
        ? submission.improvements
        : [],
      dimensionalScores: submission.dimensionalScores as any || {
        'core-professionalism': 0,
        'business-digital': 0,
        'job-fit-technical': 0,
        'growth-potential': 0,
      },
      moduleTitle: submission.assessment.module?.title,
    });

    // 6. Log the download
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'export_pdf',
        resourceType: 'submission',
        resourceId: params.id,
        changes: { fileName: generatePDFFilename(
          `${submission.candidate.firstName} ${submission.candidate.lastName}`,
          submission.assessment.title
        ) },
        ipAddress: req.ip,
        userAgent: req.headers.get('user-agent'),
      },
    });


    
      // RDF sync
      rdfSyncService.insertEntity("AuditLog", "unknown", "ISCARB", data).catch(() => {});// 7. Return PDF
    const filename = generatePDFFilename(
      `${submission.candidate.firstName} ${submission.candidate.lastName}`,
      submission.assessment.title
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate PDF',
      },
      { status: 500 }
    );
  }
}
