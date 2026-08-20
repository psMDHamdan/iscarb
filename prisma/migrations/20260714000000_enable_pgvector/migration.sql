-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create VectorEmbedding table for semantic search
CREATE TABLE "VectorEmbedding" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "universityId" TEXT,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VectorEmbedding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VectorEmbedding_entityType_entityId_universityId_key" ON "VectorEmbedding"("entityType", "entityId", "universityId");
CREATE INDEX "VectorEmbedding_entityType_idx" ON "VectorEmbedding"("entityType");
CREATE INDEX "VectorEmbedding_universityId_idx" ON "VectorEmbedding"("universityId");
CREATE INDEX "VectorEmbedding_embedding_idx" ON "VectorEmbedding" USING hnsw (embedding vector_cosine_ops);

-- Create AiConversation table
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT,
    "title" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "model" TEXT NOT NULL DEFAULT 'gpt-4o',
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiConversation_userId_idx" ON "AiConversation"("userId");

-- Create AiUsageLog table
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiUsageLog_userId_idx" ON "AiUsageLog"("userId");

-- Create UserOrganization table
CREATE TABLE "UserOrganization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserOrganization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON "UserOrganization"("userId", "organizationId");
