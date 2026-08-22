-- Add pgvector embedding column for source block RAG
-- Embedding model: nvidia/llama-3.2-nv-embedqa-1b-v2 (1024 dimensions)
ALTER TABLE "LectureSourceBlock" ADD COLUMN "embedding" vector(1024);
ALTER TABLE "LectureSourceBlock" ADD COLUMN "embeddingModel" TEXT;

-- HNSW index for fast approximate nearest-neighbor search
-- cosine distance is the standard metric for semantic similarity
CREATE INDEX "LectureSourceBlock_embedding_idx"
  ON "LectureSourceBlock"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Filter index: only index blocks that have embeddings (sparse column)
-- This is implicit in HNSW — NULLs are excluded automatically.
