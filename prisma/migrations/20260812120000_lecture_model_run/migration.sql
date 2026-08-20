-- CreateTable
CREATE TABLE "LectureModelRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "artifactId" TEXT,
    "model" TEXT NOT NULL,
    "providerRequestId" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION,
    "outputHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureModelRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LectureModelRun_projectId_idx" ON "LectureModelRun"("projectId");

-- CreateIndex
CREATE INDEX "LectureModelRun_organizationId_idx" ON "LectureModelRun"("organizationId");

-- CreateIndex
CREATE INDEX "LectureModelRun_kind_idx" ON "LectureModelRun"("kind");

-- AddForeignKey
ALTER TABLE "LectureModelRun" ADD CONSTRAINT "LectureModelRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureModelRun" ADD CONSTRAINT "LectureModelRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

