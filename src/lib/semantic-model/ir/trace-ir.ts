/**
 * Trace IR — the traceability projection of the semantic model.
 *
 * Tracks the complete chain from requirement → ontology → DB → API → UI → AI → tests.
 * Enables the Verification Engine to detect missing or inconsistent artifacts.
 */
import type { TraceLinkIR, ArtifactType, ArtifactManifest } from './types';

// ────────────────────────────────────────────────────────────────────────────
// Traceability Graph
// ────────────────────────────────────────────────────────────────────────────

export interface TraceabilityGraph {
  /** Source ontology version */
  ontologyVersion: number;
  compiledAt: string;

  /** All trace links */
  links: TraceLinkIR[];

  /** Graph statistics */
  stats: TraceabilityStats;

  /** Indexed views for fast querying */
  bySource: Record<string, TraceLinkIR[]>;
  byTarget: Record<string, TraceLinkIR[]>;
  byRelation: Record<string, TraceLinkIR[]>;
}

export interface TraceabilityStats {
  totalLinks: number;
  uniqueSources: number;
  uniqueTargets: number;
  /** Coverage by layer */
  coverage: Record<ArtifactType, number>;
  /** Missing links detected */
  missingLinks: MissingLinkIR[];
}

export interface MissingLinkIR {
  fromType: ArtifactType;
  fromId: string;
  toType: ArtifactType;
  /** Expected target entity/artifact */
  expectedTarget: string;
  severity: 'critical' | 'warning' | 'info';
}

// ────────────────────────────────────────────────────────────────────────────
// Artifact Snapshot — for comparison
// ────────────────────────────────────────────────────────────────────────────

export interface ArtifactSnapshot {
  /** When this snapshot was taken */
  timestamp: string;
  /** All artifact manifests collected */
  manifests: ArtifactManifest[];
  /** Traceability graph for this snapshot */
  traceGraph: TraceabilityGraph;
  /** Overall health score (0-100) */
  healthScore: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Drift Detection
// ────────────────────────────────────────────────────────────────────────────

export interface DriftReport {
  snapshotA: ArtifactSnapshot;
  snapshotB: ArtifactSnapshot;
  driftScore: number;

  /** Changes between snapshots */
  changes: DriftChangeIR[];

  /** Breaking changes */
  breakingChanges: DriftChangeIR[];

  /** Recommendations */
  recommendations: string[];
}

export interface DriftChangeIR {
  type: 'added' | 'removed' | 'modified';
  artifactType: ArtifactType;
  artifactId: string;
  description: string;
  /** Whether this is a breaking change */
  breaking: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Verification Result
// ────────────────────────────────────────────────────────────────────────────

export interface VerificationResult {
  /** Whether verification passed */
  passed: boolean;
  /** Overall coverage score */
  coverageScore: number;
  /** Overall drift score */
  driftScore: number;

  /** Findings by category */
  findings: VerificationFinding[];

  /** Layer-by-layer breakdown */
  layerResults: Record<string, LayerVerificationResult>;
}

export interface VerificationFinding {
  severity: 'error' | 'warning' | 'info';
  category: 'missing-entity' | 'missing-relationship' | 'missing-api' | 'missing-ui'
    | 'missing-permission' | 'missing-ai-tool' | 'missing-test' | 'missing-doc'
    | 'missing-deployment' | 'missing-monitoring' | 'missing-analytics'
    | 'inconsistency' | 'drift' | 'breaking-change';
  message: string;
  /** Source artifact */
  source?: string;
  /** Target artifact that is missing/inconsistent */
  target?: string;
}

export interface LayerVerificationResult {
  /** Artifacts expected in this layer */
  expected: number;
  /** Artifacts actually present */
  actual: number;
  /** Coverage percentage */
  coverage: number;
  /** Errors in this layer */
  errors: VerificationFinding[];
  /** Warnings in this layer */
  warnings: VerificationFinding[];
}
