-- CreateTable
CREATE TABLE "LectureProfileVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "tenantId" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effectiveAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureProfileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LectureProfileVersion_tenantId_profileType_idx" ON "LectureProfileVersion"("tenantId", "profileType");

-- CreateIndex
CREATE INDEX "LectureProfileVersion_organizationId_idx" ON "LectureProfileVersion"("organizationId");

-- AddForeignKey
ALTER TABLE "LectureProfileVersion" ADD CONSTRAINT "LectureProfileVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
