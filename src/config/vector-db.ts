/**
 * Vector Database configuration using pgvector.
 * Provides settings for vector similarity search.
 */
export const vectorDbConfig = {
  /** Embedding model dimensions */
  dimensions: parseInt(process.env.VECTOR_DIMENSION || "1024"),

  /** Default embedding model (NVIDIA catalog) */
  embeddingModel:
    process.env.OPENAI_EMBEDDING_MODEL || "nvidia/llama-3.2-nv-embedqa-1b-v2",

  /** Similarity search threshold (lower = more similar) */
  similarityThreshold: parseFloat(process.env.VECTOR_SIMILARITY_THRESHOLD || "0.7"),

  /** Maximum results per search */
  maxResults: parseInt(process.env.VECTOR_MAX_RESULTS || "20"),

  /** HNSW index configuration */
  hnsw: {
    m: 16, // Number of connections per layer
    efConstruction: 64, // Size of the dynamic candidate list during construction
  },

  /** Batch size for bulk embedding operations */
  batchSize: parseInt(process.env.VECTOR_BATCH_SIZE || "50"),

  /** Enable pgvector */
  enabled: process.env.PGVECTOR_ENABLED !== "false",

  /** Whether embeddings are optional (return empty arrays on failure) */
  optionalEmbeddings: process.env.VECTOR_EMBEDDINGS_OPTIONAL !== "false",
} as const;
