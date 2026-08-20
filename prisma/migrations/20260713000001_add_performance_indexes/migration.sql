-- iSCARB Performance Indexes
-- Masterplan Section 11.2: Database Indexing Strategy
-- These indexes optimize the most common query patterns.

-- Assessment queries: faculty lists by status, paginated lists
CREATE INDEX idx_assessment_university_status ON "Assessment"("universityId", status);
CREATE INDEX idx_assessment_university_created ON "Assessment"("universityId", "createdAt" DESC);

-- Submission queries: review queue (low-confidence submissions)
CREATE INDEX idx_submission_assessment_student_created ON "AssessmentSubmission"("assessmentId", "studentId", "startedAt");

-- Competency scores: Career OS talent search (filter by competency + score)
CREATE INDEX idx_assessment_scores_university_competency ON "AssessmentResponse"("studentId", dimension, score);

-- User lookup: email uniqueness per tenant
CREATE INDEX idx_user_university_email ON "User"("universityId", email);

-- Portfolio discovery: public portfolios
-- (portfolio table uses studentId, visibility - check if index exists)

-- Enrollment queries: course rosters, student enrollments
CREATE INDEX idx_enrollment_university_course ON "Enrollment"("universityId", "courseId");

-- Audit log queries: filterable audit trail
CREATE INDEX idx_auditlog_university_action ON "AuditLog"("organizationId", action, "at");

-- Report queries: admin dashboard
CREATE INDEX idx_report_university_status ON "Report"("universityId", status, "createdAt" DESC);

-- Notification queries: student inbox
CREATE INDEX idx_notification_student_read ON "Notification"("studentId", "readAt");

-- Job posting queries: career explorer
CREATE INDEX idx_jobposting_ssco_status ON "JobPosting"("sscoCode", sector);
