// ═══════════════════════════════════════════════════════════════════════════════
// iSCARB — Global Domain Types
// Central type definitions for all domain entities.
// ═══════════════════════════════════════════════════════════════════════════════

export type UserRole =
  | 'student'
  | 'faculty'
  | 'university_admin'
  | 'system_admin'
  | 'recruiter'
  | 'employer'
  | 'it_ops'
  | 'developer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  universityId?: string;
  organizationId?: string;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  universityId?: string;
  college: string;
  program: string;
  cohort: string;
  readinessScore: number;
  discoverable: boolean;
  userId?: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  rank: string;
  universityId?: string;
  userId?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  programType: string;
  nqfLevel: number;
  bloomTarget: string;
  domains: string;
  universityId?: string;
}

export interface Assessment {
  id: string;
  universityId: string;
  title: string;
  description?: string;
  instructions?: string;
  status: 'draft' | 'published' | 'archived';
  timeLimit?: number;
  randomizeQuestions: boolean;
  passPercentage?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  titleAr?: string;
  employer: string;
  sector: string;
  sscoCode?: string;
  minComposite: number;
  skillsJson: string;
  vision2030: boolean;
  location?: string;
  source: string;
}

export interface PageContext {
  pageId: string;
  pageType: 'dashboard' | 'course' | 'profile' | 'admin' | 'rdf-viewer' | 'assessment' | 'career' | 'research';
  userRole: UserRole;
  currentData?: unknown;
  rdfContext?: RdfGraphSnapshot;
}

export interface RdfGraphSnapshot {
  nodes: RdfNode[];
  edges: RdfEdge[];
}

export interface RdfNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, string>;
}

export interface RdfEdge {
  source: string;
  target: string;
  predicate: string;
  label: string;
}

export interface EnhanceMode {
  type: 'grammar' | 'academic' | 'simplify' | 'expand' | 'insights';
  label: string;
  description: string;
}

export interface EnhancedResult {
  original: string;
  enhanced: string;
  mode: string;
  confidence: number;
  suggestions: string[];
}
