/**
 * Build Context — carries state, configuration, and dependencies through a build run.
 *
 * Each builder receives a BuildContext and produces an ArtifactManifest.
 */
import type { OntologyEngine } from '@/lib/ontology/engine';
import type { SemanticModelIR, ArtifactManifest, CompilerDiagnostic } from '../ir/types';

// ────────────────────────────────────────────────────────────────────────────
// Build Configuration
// ────────────────────────────────────────────────────────────────────────────

export interface BuildConfig {
  /** Which builders to run (empty = all) */
  builders?: string[];
  /** Whether to force rebuild even if nothing changed */
  force?: boolean;
  /** Whether to skip verification */
  skipVerification?: boolean;
  /** CI mode — stricter checks */
  ciMode?: boolean;
  /** Output directory for generated artifacts */
  outputDir?: string;
  /** Verbose logging */
  verbose?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Build State — mutable throughout a build run
// ────────────────────────────────────────────────────────────────────────────

export interface BuildState {
  /** Build start time */
  startedAt: string;
  /** Build ID (unique per run) */
  buildId: string;
  /** Build configuration */
  config: BuildConfig;

  /** Current intermediate state — built up by builders */
  ir: SemanticModelIR;

  /** Manifests collected from each builder */
  manifests: Map<string, ArtifactManifest>;

  /** Diagnostics accumulated during the build */
  diagnostics: CompilerDiagnostic[];

  /** Whether the build failed */
  failed: boolean;
  /** Error if failed */
  error?: Error;
}

// ────────────────────────────────────────────────────────────────────────────
// Build Context — passed to every builder
// ────────────────────────────────────────────────────────────────────────────

export interface BuildContext {
  /** Build state (mutable) */
  state: BuildState;

  /** The ontology engine (source of truth) */
  ontology: OntologyEngine;

  /** Pre-loaded annotations */
  annotations: SemanticAnnotations;

  /** Legacy mapping registry (for existing Prisma models) */
  legacyMappings: Record<string, LegacyEntityMapping>;

  /** Add a diagnostic message */
  addDiagnostic(diagnostic: CompilerDiagnostic): void;

  /** Get the current IR (immutable snapshot) */
  getIR(): Readonly<SemanticModelIR>;

  /** Update the IR with new data */
  updateIR(update: Partial<SemanticModelIR>): void;

  /** Register a builder's completed manifest */
  registerManifest(builderId: string, manifest: ArtifactManifest): void;

  /** Mark build as failed */
  fail(error: Error): void;

  /** Check if build has been cancelled/failed */
  isFailed(): boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Legacy Entity Mapping
// ────────────────────────────────────────────────────────────────────────────

export interface LegacyEntityMapping {
  /** Ontology class name */
  ontologyClass: string;
  /** Prisma model name */
  prismaModel: string;
  /** Field mappings */
  fields: LegacyFieldMapping[];
  /** Relationship mappings */
  relationships: LegacyRelationshipMapping[];
  /** Projection mode */
  projectionMode: 'legacy-observed' | 'legacy-mapped';
  /** Confidence in mapping (0-1) */
  mappingConfidence: number;
}

export interface LegacyFieldMapping {
  /** Ontology property name */
  ontologyProperty: string;
  /** Prisma field name */
  prismaField: string;
  /** How they correspond */
  mapping: 'direct' | 'transformed' | 'computed';
  /** Transformation expression (if mapped = 'transformed') */
  transform?: string;
  /** Whether the mapping is verified */
  verified: boolean;
}

export interface LegacyRelationshipMapping {
  /** Ontology object property name */
  ontologyProperty: string;
  /** Prisma relationship name */
  prismaRelation: string;
  /** Cardinality match */
  cardinalityMatch: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Annotations — platform-specific metadata attached to ontology elements
// ────────────────────────────────────────────────────────────────────────────

export interface SemanticAnnotations {
  /** Entity-level annotations keyed by class name */
  entities: Record<string, EntityAnnotation>;
  /** Property-level annotations keyed by property ID */
  properties: Record<string, PropertyAnnotation>;
  /** Relationship-level annotations keyed by relationship ID */
  relationships: Record<string, RelationshipAnnotation>;
}

export interface EntityAnnotation {
  /** UI configuration */
  ui?: {
    icon?: string;
    color?: string;
    listFields?: string[];
    searchFields?: string[];
    defaultSort?: string;
  };
  /** DB configuration */
  db?: {
    tableName?: string;
    schema?: string;
    storageStrategy?: 'table' | 'view' | 'materialized-view';
    historyRetentionDays?: number;
  };
  /** API configuration */
  api?: {
    basePath?: string;
    generateCRUD?: boolean;
    generateSearch?: boolean;
    auditLogged?: boolean;
    rdfSyncEnabled?: boolean;
  };
  /** Search configuration */
  search?: {
    searchableFields?: string[];
    filterableFields?: string[];
    sortableFields?: string[];
    fullTextFields?: string[];
    vectorizedFields?: string[];
  };
  /** Permission configuration */
  permissions?: {
    createRoles?: string[];
    readRoles?: string[];
    updateRoles?: string[];
    deleteRoles?: string[];
  };
  /** Analytics configuration */
  analytics?: {
    tracked: boolean;
    metrics?: string[];
    dimensions?: string[];
  };
  /** Workflow configuration */
  workflow?: string;  // Workflow IR ID
}

export interface PropertyAnnotation {
  /** UI widget to use */
  uiWidget?: string;
  /** UI section */
  uiSection?: string;
  /** UI order */
  uiOrder?: number;
  /** Read-only in UI */
  uiReadOnly?: boolean;
  /** Whether to index this column */
  indexed?: boolean;
  /** Whether to full-text index */
  fullText?: boolean;
  /** Whether to vectorize */
  vectorized?: boolean;
}

export interface RelationshipAnnotation {
  /** UI visibility */
  exposedInUI?: boolean;
  /** API visibility */
  exposedInApi?: boolean;
  /** Storage strategy override */
  storageStrategy?: 'foreign-key' | 'join-table' | 'embedded';
}
