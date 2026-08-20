-- CreateTable
CREATE TABLE "LectureProject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "tenantId" TEXT NOT NULL,
    "courseProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "nationalAlignmentMode" TEXT NOT NULL DEFAULT 'COURSE_READINESS',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureCourseProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "tenantId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "languagePolicy" TEXT NOT NULL DEFAULT 'en',
    "audience" TEXT,
    "duration" TEXT,
    "institutionalProfile" TEXT,
    "teacherEnteredClos" JSONB NOT NULL,
    "selectedLectureCloIds" TEXT[],
    "cloApprovedBy" TEXT,
    "cloApprovedAt" TIMESTAMP(3),
    "nationalAlignmentMode" TEXT NOT NULL DEFAULT 'COURSE_READINESS',
    "jaheziahSpecialtyKey" TEXT,
    "alignmentConfirmedBy" TEXT,
    "alignmentConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureCourseProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureSourceDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'pending',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureSourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureSourceBlock" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "locator" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "criticality" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'unresolved',
    "parentBlockId" TEXT,

    CONSTRAINT "LectureSourceBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureSlidePlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "slideNo" INTEGER NOT NULL,
    "function" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cloIds" TEXT[],
    "sourceBlockIds" TEXT[],
    "interactionType" TEXT,
    "visualIntent" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureSlidePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureSlideArtifact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "slidePlanId" TEXT NOT NULL,
    "slideNo" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "contentJson" JSONB NOT NULL,
    "notesJson" JSONB,
    "assessmentJson" JSONB,
    "citations" JSONB,
    "modelRunId" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "bulletCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureSlideArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureCoverageLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "slideNo" INTEGER NOT NULL,
    "disposition" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "LectureCoverageLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureGateResult" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "gateKey" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'error',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "findings" JSONB,
    "ruleVersion" TEXT NOT NULL DEFAULT '1.0',
    "waiveReason" TEXT,
    "waivedBy" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureGateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureDecision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beforeHash" TEXT,
    "afterHash" TEXT,

    CONSTRAINT "LectureDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturePackageVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "manifestHash" TEXT,
    "approvedArtifacts" JSONB,
    "exportKeys" JSONB,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LecturePackageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthoritativeSource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "originalLanguage" TEXT NOT NULL DEFAULT 'en',
    "preferredDeveloperLanguage" TEXT NOT NULL DEFAULT 'en',
    "englishUrl" TEXT,
    "originalUrl" TEXT NOT NULL,
    "allowedDomains" TEXT[],
    "syncPolicy" TEXT NOT NULL DEFAULT 'scheduled',
    "activeSnapshotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthoritativeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthoritativeSourceSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT NOT NULL,
    "etag" TEXT,
    "publishedDate" TIMESTAMP(3),
    "contentText" TEXT NOT NULL,
    "translationOfSnapshotId" TEXT,
    "translationStatus" TEXT,
    "approvedBy" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "AuthoritativeSourceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NationalStandard" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "specialtyKey" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "klos" JSONB,
    "gkus" JSONB,
    "skus" JSONB,
    "slos" JSONB,
    "topics" JSONB,
    "weights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NationalStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureAlignmentEligibility" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "candidateSpecialtyKey" TEXT,
    "confidence" DOUBLE PRECISION,
    "rationale" TEXT,
    "sourceSnapshotId" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureAlignmentEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureAlignmentLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "standardOutcomeId" TEXT,
    "artifactId" TEXT,
    "mode" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "rationale" TEXT,
    "sourceLocator" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'pending',
    "decidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureAlignmentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureReadinessItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "alignmentMode" TEXT NOT NULL,
    "specialtyKey" TEXT,
    "outcomeId" TEXT,
    "cloId" TEXT NOT NULL,
    "sourceBlockId" TEXT,
    "slideNo" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "rationale" TEXT,
    "misconception" TEXT,
    "sourceLocator" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureReadinessItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureVisionContext" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedPrograms" TEXT[],
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "derivedOpportunityLabel" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LectureVisionContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NCAAARequirement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "sourceSnapshotId" TEXT NOT NULL,
    "clause" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "applicability" TEXT NOT NULL DEFAULT 'applicable',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NCAAARequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureNCAAAEvidenceLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "artifactId" TEXT,
    "evidenceType" TEXT NOT NULL,
    "locator" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "ownerId" TEXT,
    "qualityAction" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureNCAAAEvidenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureNCAAAReportSection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "requirementIds" TEXT[],
    "narrative" TEXT NOT NULL,
    "citations" JSONB,
    "sourceMode" TEXT NOT NULL DEFAULT 'official_snapshot',
    "verifierStatus" TEXT NOT NULL DEFAULT 'draft',
    "approval" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureNCAAAReportSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LectureProject_tenantId_idx" ON "LectureProject"("tenantId");

-- CreateIndex
CREATE INDEX "LectureProject_createdBy_idx" ON "LectureProject"("createdBy");

-- CreateIndex
CREATE INDEX "LectureProject_courseProfileId_idx" ON "LectureProject"("courseProfileId");

-- CreateIndex
CREATE INDEX "LectureProject_organizationId_idx" ON "LectureProject"("organizationId");

-- CreateIndex
CREATE INDEX "LectureCourseProfile_tenantId_idx" ON "LectureCourseProfile"("tenantId");

-- CreateIndex
CREATE INDEX "LectureCourseProfile_organizationId_idx" ON "LectureCourseProfile"("organizationId");

-- CreateIndex
CREATE INDEX "LectureSourceDocument_projectId_idx" ON "LectureSourceDocument"("projectId");

-- CreateIndex
CREATE INDEX "LectureSourceDocument_organizationId_idx" ON "LectureSourceDocument"("organizationId");

-- CreateIndex
CREATE INDEX "LectureSourceBlock_projectId_idx" ON "LectureSourceBlock"("projectId");

-- CreateIndex
CREATE INDEX "LectureSourceBlock_documentId_idx" ON "LectureSourceBlock"("documentId");

-- CreateIndex
CREATE INDEX "LectureSourceBlock_parentBlockId_idx" ON "LectureSourceBlock"("parentBlockId");

-- CreateIndex
CREATE INDEX "LectureSourceBlock_organizationId_idx" ON "LectureSourceBlock"("organizationId");

-- CreateIndex
CREATE INDEX "LectureSlidePlan_projectId_idx" ON "LectureSlidePlan"("projectId");

-- CreateIndex
CREATE INDEX "LectureSlidePlan_organizationId_idx" ON "LectureSlidePlan"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LectureSlidePlan_projectId_slideNo_key" ON "LectureSlidePlan"("projectId", "slideNo");

-- CreateIndex
CREATE INDEX "LectureSlideArtifact_projectId_idx" ON "LectureSlideArtifact"("projectId");

-- CreateIndex
CREATE INDEX "LectureSlideArtifact_slidePlanId_idx" ON "LectureSlideArtifact"("slidePlanId");

-- CreateIndex
CREATE INDEX "LectureSlideArtifact_organizationId_idx" ON "LectureSlideArtifact"("organizationId");

-- CreateIndex
CREATE INDEX "LectureCoverageLink_projectId_idx" ON "LectureCoverageLink"("projectId");

-- CreateIndex
CREATE INDEX "LectureCoverageLink_organizationId_idx" ON "LectureCoverageLink"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LectureCoverageLink_projectId_blockId_slideNo_key" ON "LectureCoverageLink"("projectId", "blockId", "slideNo");

-- CreateIndex
CREATE INDEX "LectureGateResult_projectId_idx" ON "LectureGateResult"("projectId");

-- CreateIndex
CREATE INDEX "LectureGateResult_gateKey_idx" ON "LectureGateResult"("gateKey");

-- CreateIndex
CREATE INDEX "LectureGateResult_organizationId_idx" ON "LectureGateResult"("organizationId");

-- CreateIndex
CREATE INDEX "LectureDecision_projectId_idx" ON "LectureDecision"("projectId");

-- CreateIndex
CREATE INDEX "LectureDecision_artifactId_idx" ON "LectureDecision"("artifactId");

-- CreateIndex
CREATE INDEX "LectureDecision_organizationId_idx" ON "LectureDecision"("organizationId");

-- CreateIndex
CREATE INDEX "LecturePackageVersion_projectId_idx" ON "LecturePackageVersion"("projectId");

-- CreateIndex
CREATE INDEX "LecturePackageVersion_organizationId_idx" ON "LecturePackageVersion"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthoritativeSource_sourceKey_key" ON "AuthoritativeSource"("sourceKey");

-- CreateIndex
CREATE INDEX "AuthoritativeSource_organizationId_idx" ON "AuthoritativeSource"("organizationId");

-- CreateIndex
CREATE INDEX "AuthoritativeSourceSnapshot_sourceKey_idx" ON "AuthoritativeSourceSnapshot"("sourceKey");

-- CreateIndex
CREATE INDEX "AuthoritativeSourceSnapshot_organizationId_idx" ON "AuthoritativeSourceSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "NationalStandard_specialtyKey_idx" ON "NationalStandard"("specialtyKey");

-- CreateIndex
CREATE INDEX "NationalStandard_documentId_idx" ON "NationalStandard"("documentId");

-- CreateIndex
CREATE INDEX "NationalStandard_snapshotId_idx" ON "NationalStandard"("snapshotId");

-- CreateIndex
CREATE INDEX "NationalStandard_organizationId_idx" ON "NationalStandard"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LectureAlignmentEligibility_projectId_key" ON "LectureAlignmentEligibility"("projectId");

-- CreateIndex
CREATE INDEX "LectureAlignmentEligibility_sourceSnapshotId_idx" ON "LectureAlignmentEligibility"("sourceSnapshotId");

-- CreateIndex
CREATE INDEX "LectureAlignmentEligibility_organizationId_idx" ON "LectureAlignmentEligibility"("organizationId");

-- CreateIndex
CREATE INDEX "LectureAlignmentLink_projectId_idx" ON "LectureAlignmentLink"("projectId");

-- CreateIndex
CREATE INDEX "LectureAlignmentLink_organizationId_idx" ON "LectureAlignmentLink"("organizationId");

-- CreateIndex
CREATE INDEX "LectureReadinessItem_projectId_idx" ON "LectureReadinessItem"("projectId");

-- CreateIndex
CREATE INDEX "LectureReadinessItem_organizationId_idx" ON "LectureReadinessItem"("organizationId");

-- CreateIndex
CREATE INDEX "LectureVisionContext_projectId_idx" ON "LectureVisionContext"("projectId");

-- CreateIndex
CREATE INDEX "LectureVisionContext_organizationId_idx" ON "LectureVisionContext"("organizationId");

-- CreateIndex
CREATE INDEX "NCAAARequirement_sourceSnapshotId_idx" ON "NCAAARequirement"("sourceSnapshotId");

-- CreateIndex
CREATE INDEX "NCAAARequirement_organizationId_idx" ON "NCAAARequirement"("organizationId");

-- CreateIndex
CREATE INDEX "LectureNCAAAEvidenceLink_projectId_idx" ON "LectureNCAAAEvidenceLink"("projectId");

-- CreateIndex
CREATE INDEX "LectureNCAAAEvidenceLink_requirementId_idx" ON "LectureNCAAAEvidenceLink"("requirementId");

-- CreateIndex
CREATE INDEX "LectureNCAAAEvidenceLink_organizationId_idx" ON "LectureNCAAAEvidenceLink"("organizationId");

-- CreateIndex
CREATE INDEX "LectureNCAAAReportSection_projectId_idx" ON "LectureNCAAAReportSection"("projectId");

-- CreateIndex
CREATE INDEX "LectureNCAAAReportSection_organizationId_idx" ON "LectureNCAAAReportSection"("organizationId");

-- AddForeignKey
ALTER TABLE "LectureProject" ADD CONSTRAINT "LectureProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureProject" ADD CONSTRAINT "LectureProject_courseProfileId_fkey" FOREIGN KEY ("courseProfileId") REFERENCES "LectureCourseProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureCourseProfile" ADD CONSTRAINT "LectureCourseProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSourceDocument" ADD CONSTRAINT "LectureSourceDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSourceDocument" ADD CONSTRAINT "LectureSourceDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSourceBlock" ADD CONSTRAINT "LectureSourceBlock_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSourceBlock" ADD CONSTRAINT "LectureSourceBlock_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSourceBlock" ADD CONSTRAINT "LectureSourceBlock_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LectureSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSlidePlan" ADD CONSTRAINT "LectureSlidePlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSlidePlan" ADD CONSTRAINT "LectureSlidePlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSlideArtifact" ADD CONSTRAINT "LectureSlideArtifact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSlideArtifact" ADD CONSTRAINT "LectureSlideArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSlideArtifact" ADD CONSTRAINT "LectureSlideArtifact_slidePlanId_fkey" FOREIGN KEY ("slidePlanId") REFERENCES "LectureSlidePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureCoverageLink" ADD CONSTRAINT "LectureCoverageLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureCoverageLink" ADD CONSTRAINT "LectureCoverageLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureCoverageLink" ADD CONSTRAINT "LectureCoverageLink_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "LectureSourceBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureGateResult" ADD CONSTRAINT "LectureGateResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureGateResult" ADD CONSTRAINT "LectureGateResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureDecision" ADD CONSTRAINT "LectureDecision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureDecision" ADD CONSTRAINT "LectureDecision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureDecision" ADD CONSTRAINT "LectureDecision_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "LectureSlideArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturePackageVersion" ADD CONSTRAINT "LecturePackageVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturePackageVersion" ADD CONSTRAINT "LecturePackageVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthoritativeSource" ADD CONSTRAINT "AuthoritativeSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthoritativeSourceSnapshot" ADD CONSTRAINT "AuthoritativeSourceSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthoritativeSourceSnapshot" ADD CONSTRAINT "AuthoritativeSourceSnapshot_sourceKey_fkey" FOREIGN KEY ("sourceKey") REFERENCES "AuthoritativeSource"("sourceKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NationalStandard" ADD CONSTRAINT "NationalStandard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureAlignmentEligibility" ADD CONSTRAINT "LectureAlignmentEligibility_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureAlignmentEligibility" ADD CONSTRAINT "LectureAlignmentEligibility_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureAlignmentLink" ADD CONSTRAINT "LectureAlignmentLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureAlignmentLink" ADD CONSTRAINT "LectureAlignmentLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureReadinessItem" ADD CONSTRAINT "LectureReadinessItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureReadinessItem" ADD CONSTRAINT "LectureReadinessItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureVisionContext" ADD CONSTRAINT "LectureVisionContext_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureVisionContext" ADD CONSTRAINT "LectureVisionContext_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NCAAARequirement" ADD CONSTRAINT "NCAAARequirement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureNCAAAEvidenceLink" ADD CONSTRAINT "LectureNCAAAEvidenceLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureNCAAAEvidenceLink" ADD CONSTRAINT "LectureNCAAAEvidenceLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureNCAAAEvidenceLink" ADD CONSTRAINT "LectureNCAAAEvidenceLink_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "NCAAARequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureNCAAAReportSection" ADD CONSTRAINT "LectureNCAAAReportSection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureNCAAAReportSection" ADD CONSTRAINT "LectureNCAAAReportSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
