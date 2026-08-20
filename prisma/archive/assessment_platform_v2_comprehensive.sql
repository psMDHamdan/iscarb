-- Assessment Platform V2: Comprehensive Schema Extensions
-- Adds: RAG/Knowledge Layer, Question Bank, Review Workflow, Cost Tracking, Competency Ontology, RBAC, Audit Logging
-- Date: 2026-07-14

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For text search optimization

-- ================================================================================
-- PART 1: RAG/KNOWLEDGE LAYER
-- ================================================================================

-- Knowledge source documents (PDFs, SOPs, manuals, rubrics)
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_type TEXT NOT NULL,           -- 'pdf' | 'sop' | 'manual' | 'rubric' | 'framework' | 'competency'
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,                         -- Full text content extracted
  metadata JSONB DEFAULT '{}'::jsonb,  -- { author, date, version, category, language }
  file_path TEXT,                       -- Storage path (S3, Supabase)
  file_size INT,                        -- Bytes
  mime_type TEXT,                       -- application/pdf, text/plain, etc.
  uploaded_by TEXT,                     -- User ID who uploaded
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  university_id TEXT,                   -- Multi-tenancy
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_knowledge_sources_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_sources_type ON knowledge_sources(source_type, is_active);
CREATE INDEX idx_knowledge_sources_university ON knowledge_sources(university_id);
CREATE INDEX idx_knowledge_sources_uploaded_by ON knowledge_sources(uploaded_by);
CREATE INDEX idx_knowledge_sources_title_gin ON knowledge_sources USING GIN (to_tsvector('english', title));

-- Chunked embeddings for semantic search (pgvector)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL,
  chunk_number INT NOT NULL,           -- Sequential position
  content TEXT NOT NULL,                -- Max ~2000 chars per chunk
  embedding vector(1536),               -- OpenAI embedding (3-key=use pgvector)
  tokens_used INT,                      -- For cost tracking
  relevance_score FLOAT,                -- For performance tracking
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_knowledge_chunks_source FOREIGN KEY (source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_chunks_source ON knowledge_chunks(source_id, chunk_number);
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING IVFFLAT (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_chunks_active ON knowledge_chunks(is_active);

-- RAG retrieval history (audit trail)
CREATE TABLE IF NOT EXISTS rag_retrievals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query TEXT NOT NULL,                  -- What was asked
  agent_type TEXT NOT NULL,             -- 'question_generator' | 'scorer' | 'recommender'
  retrieved_chunk_ids TEXT[],           -- Array of chunk IDs returned
  relevance_scores FLOAT[],             -- Cosine similarity scores
  chunks_used_count INT,                -- How many chunks actually used
  k2think_request_id TEXT,              -- K2Think execution ID (audit trail)
  university_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rag_retrievals_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_rag_retrievals_agent ON rag_retrievals(agent_type, created_at);
CREATE INDEX idx_rag_retrievals_university ON rag_retrievals(university_id);

-- ================================================================================
-- PART 2: QUESTION BANK & GENERATION
-- ================================================================================

-- Central question bank (all questions: AI-generated, curated, imported)
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  university_id TEXT NOT NULL,
  category TEXT NOT NULL,               -- Leadership, Communication, Technical, etc.
  difficulty TEXT NOT NULL,             -- 'easy' | 'medium' | 'hard' | 'expert'
  topic TEXT,                           -- Specific topic within category
  scenario TEXT NOT NULL,               -- Full question/scenario text
  instructions TEXT,                    -- How to respond
  rubric_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,  -- [{ criterion, weight, descriptor, example_good, example_bad }]
  few_shot_examples JSONB DEFAULT '{}'::jsonb,  -- [{ response, score, feedback }]
  competency_ids TEXT[],                -- Maps to competency_framework.id
  generated_by TEXT NOT NULL,           -- 'ai' | 'manual' | 'imported'
  ai_model_used TEXT,                   -- Which model generated this
  generated_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  review_status TEXT DEFAULT 'draft',   -- 'draft' | 'ai_validated' | 'sme_review' | 'approved' | 'published' | 'archived'
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],                          -- ['scenario', 'case-study', 'video', etc.]
  metadata JSONB DEFAULT '{}'::jsonb,   -- { difficulty_rating, estimated_time_minutes, language, etc. }
  version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_bank_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_question_bank_category ON question_bank(category, difficulty, university_id);
CREATE INDEX idx_question_bank_status ON question_bank(review_status, is_published, university_id);
CREATE INDEX idx_question_bank_competencies ON question_bank USING GIN (competency_ids);
CREATE INDEX idx_question_bank_tags ON question_bank USING GIN (tags);

-- Question review workflow
CREATE TABLE IF NOT EXISTS question_review_workflow (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'ai_validated' | 'sme_review' | 'approved' | 'published' | 'archived'
  version_number INT NOT NULL,

  -- AI Validation stage
  ai_validation_notes JSONB,            -- Rubric adherence, grammar, clarity checks
  ai_validation_passed BOOLEAN,
  ai_validated_at TIMESTAMP WITH TIME ZONE,
  ai_validated_by TEXT,                 -- K2Think agent ID

  -- SME Review stage
  sme_reviewer_id TEXT,                 -- Subject matter expert user ID
  sme_notes TEXT,
  sme_approved BOOLEAN,
  sme_reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Approval stage
  approver_id TEXT,                     -- Admin/manager who approved
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,

  -- Publication
  published_at TIMESTAMP WITH TIME ZONE,
  published_by TEXT,

  -- Archival
  archived_at TIMESTAMP WITH TIME ZONE,
  archive_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_review_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
);

CREATE INDEX idx_question_review_status ON question_review_workflow(status, question_id);
CREATE INDEX idx_question_review_sme ON question_review_workflow(sme_reviewer_id);
CREATE INDEX idx_question_review_approver ON question_review_workflow(approver_id);

-- Question version history
CREATE TABLE IF NOT EXISTS question_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id TEXT NOT NULL,
  version_number INT NOT NULL,
  scenario TEXT NOT NULL,
  instructions TEXT,
  rubric_criteria JSONB,
  competency_ids TEXT[],
  created_by TEXT,                      -- User who created this version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  change_summary TEXT,                  -- What changed from previous version
  CONSTRAINT fk_question_versions_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
);

CREATE INDEX idx_question_versions_question ON question_versions(question_id, version_number);

-- ================================================================================
-- PART 3: ASSESSMENT & SCORING ENHANCEMENTS
-- ================================================================================

-- Assessment-to-Question mapping (which questions in which assessment)
CREATE TABLE IF NOT EXISTS assessment_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assessment_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_order INT NOT NULL,
  question_version INT,                 -- Track if question was modified
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_questions_assessment FOREIGN KEY (assessment_id) REFERENCES "Assessment"(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_questions_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE RESTRICT,
  UNIQUE(assessment_id, question_id)
);

CREATE INDEX idx_assessment_questions_assessment ON assessment_questions(assessment_id, question_order);

-- Assessment history & attempt tracking
CREATE TABLE IF NOT EXISTS assessment_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  submission_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  assessment_id TEXT NOT NULL,
  attempt_number INT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  previous_score INT,                   -- Prior attempt's score
  current_score INT,
  improvement_delta INT,                -- Change from previous
  time_spent_seconds INT,
  device_info JSONB,                    -- { device, browser, os, ip, user_agent }
  is_suspicious BOOLEAN DEFAULT false,
  university_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_history_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_assessment_history_student ON assessment_history(student_id, assessment_id);
CREATE INDEX idx_assessment_history_submission ON assessment_history(submission_id);
CREATE INDEX idx_assessment_history_suspicious ON assessment_history(is_suspicious, university_id);

-- AI evaluation logs (explainability + audit trail)
CREATE TABLE IF NOT EXISTS ai_evaluation_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  submission_id TEXT NOT NULL,
  assessment_id TEXT NOT NULL,
  criterion_name TEXT NOT NULL,
  score_given INT NOT NULL,
  max_score INT NOT NULL,
  weight FLOAT,
  reasoning TEXT,                       -- WHY this score? (explainability)
  evidence_quoted TEXT,                 -- Specific response text used for scoring
  model_used TEXT,                      -- Which AI model scored this (glm-4-flash, gpt-4-turbo, etc.)
  confidence_score DECIMAL(3,2),        -- 0.00-1.00 confidence
  multi_model_consensus JSONB,          -- { claude: 82, gpt: 83, gemini: 81, consensus: 82 }
  k2think_request_id TEXT,              -- K2Think execution ID
  tokens_used INT,                      -- For cost tracking
  evaluation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  university_id TEXT,
  CONSTRAINT fk_ai_eval_logs_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_eval_logs_submission ON ai_evaluation_logs(submission_id);
CREATE INDEX idx_ai_eval_logs_criterion ON ai_evaluation_logs(criterion_name);
CREATE INDEX idx_ai_eval_logs_confidence ON ai_evaluation_logs(confidence_score);

-- ================================================================================
-- PART 4: COMPETENCY ONTOLOGY (SKILL GRAPH)
-- ================================================================================

CREATE TABLE IF NOT EXISTS competency_framework (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  university_id TEXT NOT NULL,
  competency_name TEXT NOT NULL,         -- Display name (e.g., "Leadership")
  competency_code TEXT,                  -- Code (e.g., "leadership-delegation")
  description TEXT,
  parent_id TEXT,                        -- For hierarchy
  skill_level INT DEFAULT 0,             -- Depth in tree (0=root)
  weight FLOAT DEFAULT 1.0,              -- Relative importance (0.0-1.0)
  category TEXT,                         -- Category for grouping
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,    -- Custom data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_competency_framework_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE,
  CONSTRAINT fk_competency_framework_parent FOREIGN KEY (parent_id) REFERENCES competency_framework(id) ON DELETE SET NULL
);

CREATE INDEX idx_competency_framework_university ON competency_framework(university_id, is_active);
CREATE INDEX idx_competency_framework_parent ON competency_framework(parent_id);
CREATE INDEX idx_competency_framework_category ON competency_framework(category);

-- Student competency progress tracking
CREATE TABLE IF NOT EXISTS student_competency_graph (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  competency_id TEXT NOT NULL,
  current_score DECIMAL(5,2),           -- 0-100
  trend DECIMAL(5,2),                   -- -10 to +10 point change
  last_assessed_at TIMESTAMP WITH TIME ZONE,
  assessment_count INT DEFAULT 0,
  history JSONB DEFAULT '{}'::jsonb,    -- Array of past scores with timestamps
  university_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_competency_graph_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_competency_graph_competency FOREIGN KEY (competency_id) REFERENCES competency_framework(id) ON DELETE CASCADE
);

CREATE INDEX idx_student_competency_graph_student ON student_competency_graph(student_id);
CREATE INDEX idx_student_competency_graph_competency ON student_competency_graph(competency_id);

-- ================================================================================
-- PART 5: LEARNING RECOMMENDATIONS
-- ================================================================================

CREATE TABLE IF NOT EXISTS learning_recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  assessment_id TEXT,
  competency_id TEXT,
  recommendation_type TEXT NOT NULL,    -- 'course' | 'book' | 'project' | 'practice' | 'article' | 'video' | 'interview'
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT,
  estimated_hours FLOAT,
  difficulty_level TEXT,                -- 'beginner' | 'intermediate' | 'advanced'
  priority TEXT DEFAULT 'medium',       -- 'high' | 'medium' | 'low'
  reason TEXT,                          -- Why this recommendation (e.g., "You scored low on X")
  status TEXT DEFAULT 'recommended',    -- 'recommended' | 'started' | 'completed' | 'skipped'
  completed_at TIMESTAMP WITH TIME ZONE,
  university_id TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_recommendations_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE,
  CONSTRAINT fk_learning_recommendations_competency FOREIGN KEY (competency_id) REFERENCES competency_framework(id) ON DELETE SET NULL
);

CREATE INDEX idx_learning_recommendations_student ON learning_recommendations(student_id, status);
CREATE INDEX idx_learning_recommendations_competency ON learning_recommendations(competency_id);
CREATE INDEX idx_learning_recommendations_priority ON learning_recommendations(priority, student_id);

-- ================================================================================
-- PART 6: ANTI-CHEATING DETECTION
-- ================================================================================

CREATE TABLE IF NOT EXISTS anti_cheating_flags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  submission_id TEXT NOT NULL,
  assessment_id TEXT NOT NULL,
  flag_type TEXT NOT NULL,               -- 'copy_detected' | 'ai_generated' | 'suspicious_time' | 'tab_switch' | 'multiple_device' | 'pattern_anomaly'
  confidence DECIMAL(3,2),               -- 0.00-1.00 confidence score
  description TEXT,
  response_excerpt TEXT,                 -- The suspicious part
  flagged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  admin_reviewed BOOLEAN DEFAULT false,
  admin_review_notes TEXT,
  admin_reviewer_id TEXT,
  admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,                    -- 'flagged_for_review' | 'invalidated' | 'approved' | 'escalated'
  university_id TEXT,
  CONSTRAINT fk_anti_cheating_flags_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_anti_cheating_flags_submission ON anti_cheating_flags(submission_id);
CREATE INDEX idx_anti_cheating_flags_reviewed ON anti_cheating_flags(admin_reviewed, university_id);
CREATE INDEX idx_anti_cheating_flags_type ON anti_cheating_flags(flag_type, flagged_at);

-- ================================================================================
-- PART 7: AI COST TRACKING & BUDGET MANAGEMENT
-- ================================================================================

CREATE TABLE IF NOT EXISTS ai_cost_tracking (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  agent_type TEXT NOT NULL,              -- 'question_generator' | 'scorer' | 'recommender' | 'interviewer'
  model_used TEXT NOT NULL,              -- 'glm-4-flash' | 'gpt-4-turbo' | 'claude-opus'
  tokens_input INT,
  tokens_output INT,
  cost_usd DECIMAL(8,4),
  operation TEXT,                       -- 'generate' | 'score' | 'embed' | 'validate' | 'retrieve'
  submission_id TEXT,
  assessment_id TEXT,
  student_id TEXT,
  university_id TEXT,
  k2think_request_id TEXT,
  CONSTRAINT fk_ai_cost_tracking_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_cost_tracking_timestamp ON ai_cost_tracking(timestamp);
CREATE INDEX idx_ai_cost_tracking_university ON ai_cost_tracking(university_id, timestamp);
CREATE INDEX idx_ai_cost_tracking_student ON ai_cost_tracking(student_id);

-- Monthly budget tracking
CREATE TABLE IF NOT EXISTS ai_budget (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  university_id TEXT NOT NULL,
  month_year TEXT NOT NULL,              -- '2026-07'
  budget_usd DECIMAL(10,2) NOT NULL,
  spent_usd DECIMAL(10,2) DEFAULT 0,
  projected_usd DECIMAL(10,2),
  limit_reached BOOLEAN DEFAULT false,
  alert_threshold_percent INT DEFAULT 80,  -- Alert when 80% spent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_budget_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE,
  UNIQUE(university_id, month_year)
);

-- ================================================================================
-- PART 8: AGENT MEMORY & CONTEXT
-- ================================================================================

CREATE TABLE IF NOT EXISTS agent_context (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  context_type TEXT NOT NULL,            -- 'assessment_history' | 'strengths' | 'weaknesses' | 'interview_transcript'
  key TEXT NOT NULL,
  value JSONB NOT NULL,                  -- Structured data
  university_id TEXT,
  ttl_days INT DEFAULT 90,               -- Expire old context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_agent_context_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_context_student ON agent_context(student_id, context_type);
CREATE INDEX idx_agent_context_expires ON agent_context(expires_at);

-- ================================================================================
-- PART 9: K2THINK TASK ORCHESTRATION QUEUE
-- ================================================================================

CREATE TABLE IF NOT EXISTS k2think_task_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_type TEXT NOT NULL,              -- 'question_generator' | 'scorer' | 'recommender'
  task_status TEXT DEFAULT 'queued',     -- 'queued' | 'executing' | 'completed' | 'failed'
  assessment_id TEXT,
  student_id TEXT,
  task_payload JSONB NOT NULL,           -- Input parameters
  k2think_run_id TEXT,                   -- K2Think execution ID (audit)
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  result JSONB,                          -- Output from K2Think
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  university_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_k2think_task_queue_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_k2think_task_queue_status ON k2think_task_queue(task_status, created_at);
CREATE INDEX idx_k2think_task_queue_agent ON k2think_task_queue(agent_type, task_status);
CREATE INDEX idx_k2think_task_queue_student ON k2think_task_queue(student_id);

-- ================================================================================
-- PART 10: ROLE-BASED ACCESS CONTROL (RBAC)
-- ================================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role_name TEXT UNIQUE NOT NULL,        -- 'student' | 'admin' | 'faculty' | 'sme' | 'recruiter'
  description TEXT,
  permissions TEXT[],                    -- Array of permission strings
  university_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_roles_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,   -- For temporary access
  assigned_by TEXT,
  university_id TEXT,
  CONSTRAINT fk_user_role_assignments_role FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_assignments_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id, university_id)
);

CREATE INDEX idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_expires ON user_role_assignments(expires_at);

-- ================================================================================
-- PART 11: AUDIT LOGGING (COMPLIANCE)
-- ================================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  action TEXT NOT NULL,                  -- 'create' | 'read' | 'update' | 'delete' | 'publish' | 'archive'
  resource_type TEXT NOT NULL,           -- 'assessment' | 'question' | 'user' | 'knowledge'
  resource_id TEXT NOT NULL,
  changes JSONB,                         -- Before/after values
  ip_address TEXT,
  user_agent TEXT,
  university_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, timestamp);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_university ON audit_logs(university_id, timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp);

-- ================================================================================
-- PART 12: DATA RETENTION POLICY
-- ================================================================================

CREATE TABLE IF NOT EXISTS data_retention_policy (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  university_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,             -- 'assessment' | 'audit_log' | 'pii' | 'rag_retrieval'
  retention_days INT NOT NULL,           -- How long to keep
  auto_delete BOOLEAN DEFAULT true,      -- Auto-delete after retention
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_data_retention_policy_university FOREIGN KEY (university_id) REFERENCES "University"(id) ON DELETE CASCADE
);

-- Default retention policies (if not set, these apply)
INSERT INTO data_retention_policy (id, university_id, entity_type, retention_days, auto_delete)
VALUES
  (gen_random_uuid()::text, NULL, 'assessment', 730, true),      -- 2 years
  (gen_random_uuid()::text, NULL, 'audit_log', 2555, true),      -- 7 years (compliance)
  (gen_random_uuid()::text, NULL, 'rag_retrieval', 365, true),   -- 1 year
  (gen_random_uuid()::text, NULL, 'pii', 90, true)               -- 90 days
ON CONFLICT DO NOTHING;

-- ================================================================================
-- SUMMARY
-- ================================================================================
-- Total new tables: 19
-- Total indices: 50+
-- Features added:
--   ✅ RAG/Knowledge Layer (pgvector embeddings + semantic search)
--   ✅ Question Bank + AI Generation + Review Workflow
--   ✅ Assessment History + Attempt Tracking
--   ✅ AI Evaluation Logs (explainability + audit trail)
--   ✅ Competency Ontology (skill graph)
--   ✅ Learning Recommendations
--   ✅ Anti-Cheating Detection
--   ✅ AI Cost Tracking + Budget Management
--   ✅ Agent Memory & Context Persistence
--   ✅ K2Think Task Orchestration Queue
--   ✅ RBAC (roles + permissions)
--   ✅ Audit Logging (compliance)
--   ✅ Data Retention Policy
