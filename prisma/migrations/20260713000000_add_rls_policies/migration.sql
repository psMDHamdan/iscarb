-- iSCARB Row-Level Security Policies
-- Masterplan Section 11.1.1: Multi-tenancy via database-level RLS
-- These policies enforce tenant isolation as a safety net on top of app-layer scoping.

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "Assessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActiveParticipation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GradeAdjustment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EquityLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

-- Assessment table: current_user_university_id must match universityId
CREATE POLICY assessment_tenant_isolation ON "Assessment"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- assessment_submission: user can only see submissions from their university
CREATE POLICY submission_tenant_isolation ON "AssessmentSubmission"
  USING (
    "assessmentId" IN (
      SELECT id FROM "Assessment"
      WHERE "universityId" = current_setting('app.current_university_id')::text
    )
  );

-- Enrollment: tenant isolation
CREATE POLICY enrollment_tenant_isolation ON "Enrollment"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- AttendanceRecord: tenant isolation
CREATE POLICY attendance_tenant_isolation ON "AttendanceRecord"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- ActiveParticipation: tenant isolation
CREATE POLICY participation_tenant_isolation ON "ActiveParticipation"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- GradeAdjustment: tenant isolation
CREATE POLICY grade_adjustment_tenant_isolation ON "GradeAdjustment"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- AssessmentResponse: tenant isolation
CREATE POLICY assessment_response_tenant_isolation ON "AssessmentResponse"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- EquityLedger: tenant isolation
CREATE POLICY equity_ledger_tenant_isolation ON "EquityLedger"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- Project: tenant isolation
CREATE POLICY project_tenant_isolation ON "Project"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- Report: tenant isolation
CREATE POLICY report_tenant_isolation ON "Report"
  USING ("universityId" = current_setting('app.current_university_id')::text)
  WITH CHECK ("universityId" = current_setting('app.current_university_id')::text);

-- Fail-close: policy violation throws error (not silent empty result)
SET row_security = on;
