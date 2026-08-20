/**
 * Verification Engine — the heart of the ontology-driven governance layer.
 *
 * Continuously compares the chain:
 *   Requirements → Ontology → Database → API → Frontend → AI → Tests → Docs → Deployment
 *
 * Detects missing or inconsistent artifacts and produces coverage reports.
 * Integrates with standalone rule files for each layer.
 *
 * Runs in:
 * - Editor mode (real-time feedback during authoring)
 * - CI mode (gating pull requests)
 * - Scheduled mode (periodic drift detection)
 */
import type {
  SemanticModelIR,
  EntityIR,
  ArtifactManifest,
  ArtifactEntry,
  CompilerDiagnostic,
  TraceLinkIR,
  ArtifactType,
} from '../ir/types';
import type {
  VerificationResult,
  VerificationFinding,
  LayerVerificationResult,
  TraceabilityGraph,
} from '../ir/trace-ir';
import { ArtifactRegistry } from '../registry/artifact-registry';
import { runStructuralRules, runDbRules } from './rules';

// ────────────────────────────────────────────────────────────────────────────
// Verification Options
// ────────────────────────────────────────────────────────────────────────────

export interface VerificationOptions {
  /** Whether to run in strict mode (all findings are errors) */
  strict?: boolean;
  /** Layers to verify */
  layers?: LayerType[];
  /** Whether to verify traceability completeness */
  verifyTraceability?: boolean;
  /** Whether to verify drift from previous build */
  verifyDrift?: boolean;
  /** Minimum acceptable coverage per layer (0-100) */
  minimumCoverage?: number;
  /** Previous IR for drift detection */
  previousIR?: SemanticModelIR;
}

export type LayerType =
  | 'requirements'
  | 'ontology'
  | 'database'
  | 'api'
  | 'frontend'
  | 'ai'
  | 'tests'
  | 'docs'
  | 'deployment'
  | 'monitoring'
  | 'analytics';

const ALL_LAYERS: LayerType[] = [
  'requirements',
  'ontology',
  'database',
  'api',
  'frontend',
  'ai',
  'tests',
  'docs',
  'deployment',
  'monitoring',
  'analytics',
];

const DEFAULT_OPTIONS: VerificationOptions = {
  strict: false,
  layers: ALL_LAYERS,
  verifyTraceability: true,
  verifyDrift: false,
  minimumCoverage: 80,
};

// ────────────────────────────────────────────────────────────────────────────
// Verification Engine
// ────────────────────────────────────────────────────────────────────────────

export class VerificationEngine {
  private ir: SemanticModelIR;
  private options: VerificationOptions;
  private artifactRegistry: ArtifactRegistry;

  private findings: VerificationFinding[] = [];
  private layerResults: Record<string, LayerVerificationResult> = {};

  constructor(
    ir: SemanticModelIR,
    options: VerificationOptions = {},
    artifactRegistry?: ArtifactRegistry,
  ) {
    this.ir = ir;
    this.artifactRegistry = artifactRegistry || new ArtifactRegistry();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Run full verification against the semantic IR.
   * Checks every layer for completeness and consistency.
   */
  async verify(): Promise<VerificationResult> {
    this.findings = [];
    this.layerResults = {};

    const selectedLayers = this.options.layers || ALL_LAYERS;

    // Run structural rules from the rules module
    const structuralResult = runStructuralRules(this.ir);
    for (const finding of structuralResult.findings) {
      this.findings.push(finding);
    }

    for (const layer of selectedLayers) {
      const result = await this.verifyLayer(layer);
      this.layerResults[layer] = result;
    }

    // Verify traceability completeness
    if (this.options.verifyTraceability) {
      this.verifyTraceabilityCompleteness();
    }

    // Verify drift from previous IR
    if (this.options.verifyDrift && this.options.previousIR) {
      this.verifyDriftBetween(this.ir, this.options.previousIR);
    }

    const totalExpected = Object.values(this.layerResults).reduce((s, r) => s + r.expected, 0);
    const totalActual = Object.values(this.layerResults).reduce((s, r) => s + r.actual, 0);
    const coverageScore = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 100;

    const errors = this.findings.filter((f) => f.severity === 'error');
    const passed = this.options.strict
      ? errors.length === 0 && coverageScore >= (this.options.minimumCoverage || 80)
      : errors.length === 0;

    return {
      passed,
      coverageScore,
      driftScore: this.calculateDriftScore(this.findings),
      findings: this.findings,
      layerResults: this.layerResults,
    };
  }

  /**
   * Build a TraceabilityGraph from the IR's trace links.
   * Populates the indexed views (bySource, byTarget, byRelation).
   */
  buildTraceabilityGraph(): TraceabilityGraph {
    const links = this.ir.traceability;
    const bySource: Record<string, TraceLinkIR[]> = {};
    const byTarget: Record<string, TraceLinkIR[]> = {};
    const byRelation: Record<string, TraceLinkIR[]> = {};

    for (const link of links) {
      // bySource
      if (!bySource[link.sourceId]) bySource[link.sourceId] = [];
      bySource[link.sourceId].push(link);

      // byTarget
      if (!byTarget[link.targetId]) byTarget[link.targetId] = [];
      byTarget[link.targetId].push(link);

      // byRelation
      if (!byRelation[link.relation]) byRelation[link.relation] = [];
      byRelation[link.relation].push(link);
    }

    // Calculate coverage per artifact type
    const coverage: Record<string, number> = {};
    for (const link of links) {
      coverage[link.sourceType] = (coverage[link.sourceType] || 0) + 1;
    }

    const uniqueSources = new Set(links.map((l) => l.sourceId)).size;
    const uniqueTargets = new Set(links.map((l) => l.targetId)).size;

    return {
      ontologyVersion: this.ir.ontologyVersion,
      compiledAt: new Date().toISOString(),
      links,
      stats: {
        totalLinks: links.length,
        uniqueSources,
        uniqueTargets,
        coverage: coverage as any,
        missingLinks: [],
      },
      bySource,
      byTarget,
      byRelation,
    };
  }

  /**
   * Verify a specific layer.
   */
  private async verifyLayer(layer: LayerType): Promise<LayerVerificationResult> {
    const layerFindings: VerificationFinding[] = [];
    let expected = 0;
    let actual = 0;

    switch (layer) {
      case 'ontology': this.verifyOntologyLayer(layerFindings); break;
      case 'database': this.verifyDatabaseLayer(layerFindings); break;
      case 'api': this.verifyApiLayer(layerFindings); break;
      case 'frontend': this.verifyFrontendLayer(layerFindings); break;
      case 'ai': this.verifyAiLayer(layerFindings); break;
      case 'tests': this.verifyTestLayer(layerFindings); break;
      case 'requirements': this.verifyRequirementLayer(layerFindings); break;
      case 'docs': this.verifyDocsLayer(layerFindings); break;
      case 'deployment': this.verifyDeploymentLayer(layerFindings); break;
      case 'monitoring': this.verifyMonitoringLayer(layerFindings); break;
      case 'analytics': this.verifyAnalyticsLayer(layerFindings); break;
    }

    // Count expected generated entities for data layers
    const generatedEntities = this.ir.entities.filter(
      (e) => e.projectionMode === 'generated-greenfield' || e.projectionMode === 'generated-authoritative',
    );

    // For data layers, expected = generated entities that should have artifacts
    if (layer === 'database' || layer === 'api' || layer === 'frontend') {
      expected = generatedEntities.length;
    } else if (layer === 'ontology') {
      expected = this.ir.entities.length + this.ir.properties.length + this.ir.relationships.length;
    } else if (layer === 'tests') {
      expected = this.ir.tests.length;
    }

    // Count actual artifacts from the registry and traceability links
    actual = this.countActualArtifacts(layer, generatedEntities);

    // Also run layer-specific rule modules
    let ruleFindings: VerificationFinding[] = [];
    if (layer === 'database') {
      ruleFindings = runDbRules(this.ir).findings;
    }
    for (const finding of ruleFindings) {
      layerFindings.push(finding);
    }

    this.findings.push(...layerFindings);

    const errors = layerFindings.filter((f) => f.severity === 'error');
    const warnings = layerFindings.filter((f) => f.severity === 'warning');

    return {
      expected: Math.max(expected, 1),
      actual,
      coverage: expected > 0 ? Math.round((actual / expected) * 100) : 100,
      errors,
      warnings,
    };
  }

  /**
   * Count actual artifacts for a layer.
   * Uses both the artifact registry (if populated) and traceability links.
   */
  private countActualArtifacts(layer: LayerType, generatedEntities: EntityIR[]): number {
    // Try from artifact registry manifests first
    const snapshot = this.artifactRegistry.getLatestSnapshot();
    const manifests = snapshot.manifests;
    let count = 0;

    for (const manifest of manifests) {
      for (const artifact of manifest.artifacts) {
        if (this.isLayerArtifact(layer, artifact.artifactType)) {
          count++;
        }
      }
    }

    // If no manifests yet, estimate from traceability links
    if (count === 0) {
      const layerTypes = this.getLayerArtifactTypes(layer);
      for (const link of this.ir.traceability) {
        if (layerTypes.includes(link.targetType as ArtifactType)) {
          count++;
        }
        if (layerTypes.includes(link.sourceType as ArtifactType)) {
          count++;
        }
      }
    }

    return count;
  }

  // ─── Layer Verifiers ────────────────────────────────────────────────────

  private verifyOntologyLayer(findings: VerificationFinding[]): void {
    for (const entity of this.ir.entities) {
      if (entity.projectionMode === 'generated-greenfield' && entity.ownedProperties.length === 0) {
        findings.push({
          severity: 'warning',
          category: 'missing-entity',
          message: `Generated entity '${entity.name}' has no owned properties`,
          source: `ontology:${entity.name}`,
        });
      }
    }

    for (const prop of this.ir.properties) {
      if (!this.ir.entities.find((e) => e.name === prop.domain)) {
        findings.push({
          severity: 'error',
          category: 'inconsistency',
          message: `Property '${prop.name}' references unknown domain '${prop.domain}'`,
          source: `ontology:${prop.id}`,
        });
      }
    }

    for (const rel of this.ir.relationships) {
      if (!this.ir.entities.find((e) => e.name === rel.domain)) {
        findings.push({
          severity: 'error',
          category: 'inconsistency',
          message: `Relationship '${rel.name}' references unknown domain '${rel.domain}'`,
          source: `ontology:${rel.id}`,
        });
      }
      if (!this.ir.entities.find((e) => e.name === rel.range)) {
        findings.push({
          severity: 'error',
          category: 'inconsistency',
          message: `Relationship '${rel.name}' references unknown range '${rel.range}'`,
          source: `ontology:${rel.id}`,
        });
      }
    }
  }

  private verifyDatabaseLayer(findings: VerificationFinding[]): void {
    for (const entity of this.ir.entities) {
      if (entity.projectionMode === 'generated-greenfield') {
        const hasTableLink = this.ir.traceability.some(
          (t) => t.sourceId === entity.name && t.targetType === 'database-table',
        );
        if (!hasTableLink) {
          findings.push({
            severity: 'info',
            category: 'missing-api',
            message: `Entity '${entity.name}' has no database table artifact`,
            source: `entity:${entity.name}`,
            target: 'database',
          });
        }
      }
    }
  }

  private verifyApiLayer(findings: VerificationFinding[]): void {
    for (const entity of this.ir.entities) {
      if (entity.projectionMode === 'generated-greenfield' || entity.projectionMode === 'generated-authoritative') {
        const hasApiLinks = this.ir.traceability.some(
          (t) => t.sourceId === entity.name && t.targetType === 'api-endpoint',
        );
        if (!hasApiLinks) {
          findings.push({
            severity: 'info',
            category: 'missing-api',
            message: `Entity '${entity.name}' has no API endpoints`,
            source: `entity:${entity.name}`,
            target: 'api',
          });
        }
      }
    }

    if (this.ir.api.length === 0 && this.ir.entities.filter(e => e.projectionMode === 'generated-greenfield').length > 0) {
      findings.push({
        severity: 'info',
        category: 'missing-api',
        message: `No API endpoints defined in IR for ${this.ir.entities.filter(e => e.projectionMode === 'generated-greenfield').length} generated entities`,
      });
    }
  }

  private verifyFrontendLayer(findings: VerificationFinding[]): void {
    for (const entity of this.ir.entities) {
      if (entity.projectionMode === 'generated-greenfield') {
        const hasViewLinks = this.ir.traceability.some(
          (t) => t.sourceId === entity.name && t.targetType === 'ui-view',
        );
        if (!hasViewLinks) {
          findings.push({
            severity: 'info',
            category: 'missing-ui',
            message: `Entity '${entity.name}' has no UI view artifacts`,
            source: `entity:${entity.name}`,
            target: 'frontend',
          });
        }
      }
    }
  }

  private verifyAiLayer(findings: VerificationFinding[]): void {
    for (const entity of this.ir.entities) {
      if (entity.projectionMode === 'generated-authoritative') {
        const hasAiLinks = this.ir.traceability.some(
          (t) => t.sourceId === entity.name && t.targetType === 'ai-tool',
        );
        if (!hasAiLinks) {
          findings.push({
            severity: 'info',
            category: 'missing-ai-tool',
            message: `Entity '${entity.name}' has no AI tool defined`,
            source: `entity:${entity.name}`,
            target: 'ai',
          });
        }
      }
    }
  }

  private verifyTestLayer(findings: VerificationFinding[]): void {
    if (this.ir.tests.length === 0 && this.ir.entities.length > 0) {
      findings.push({
        severity: 'info',
        category: 'missing-test',
        message: 'No test specifications defined in the IR',
      });
    }
  }

  private verifyRequirementLayer(findings: VerificationFinding[]): void {
    for (const req of this.ir.requirements) {
      if (req.satisfiesEntities.length === 0) {
        findings.push({
          severity: 'warning',
          category: 'missing-entity',
          message: `Requirement '${req.title}' does not satisfy any entities`,
          source: `requirement:${req.id}`,
        });
      }
    }
  }

  private verifyDocsLayer(findings: VerificationFinding[]): void {
    if (this.ir.entities.length > 0) {
      const docLinks = this.ir.traceability.filter((t) => t.targetType === 'documentation-page');
      if (docLinks.length === 0) {
        findings.push({
          severity: 'info',
          category: 'missing-doc',
          message: 'No documentation page artifacts found',
        });
      }
    }
  }

  private verifyDeploymentLayer(findings: VerificationFinding[]): void {
    const authoritative = this.ir.entities.filter(e => e.projectionMode === 'generated-authoritative');
    if (this.ir.deployment.length === 0 && authoritative.length > 0) {
      findings.push({
        severity: 'info',
        category: 'missing-deployment',
        message: 'No deployment configuration defined for generated entities',
      });
    }
  }

  private verifyMonitoringLayer(_findings: VerificationFinding[]): void {
    // Monitoring is operational — informational checks only
  }

  private verifyAnalyticsLayer(findings: VerificationFinding[]): void {
    if (this.ir.analytics.length === 0 && this.ir.entities.length > 0) {
      findings.push({
        severity: 'info',
        category: 'missing-analytics',
        message: 'No analytics/KPI definitions in the IR',
      });
    }
  }

  // ─── Traceability Verification ──────────────────────────────────────────

  private verifyTraceabilityCompleteness(): void {
    for (const entity of this.ir.entities) {
      for (const propRef of entity.ownedProperties) {
        const hasLink = this.ir.traceability.some(
          (t) => t.sourceId === entity.name && t.targetId === propRef.propertyId,
        );
        if (!hasLink) {
          this.findings.push({
            severity: 'info',
            category: 'inconsistency',
            message: `No traceability link from '${entity.name}' to property '${propRef.name}'`,
            source: `entity:${entity.name}`,
            target: `property:${propRef.propertyId}`,
          });
        }
      }
    }
  }

  // ─── Drift Verification (between two IRs) ─────────────────────────────

  private verifyDriftBetween(current: SemanticModelIR, previous: SemanticModelIR): void {
    // Entity-level drift
    const currentEntityNames = new Set(current.entities.map((e) => e.name));
    const previousEntityNames = new Set(previous.entities.map((e) => e.name));

    for (const name of previousEntityNames) {
      if (!currentEntityNames.has(name)) {
        this.findings.push({
          severity: 'warning',
          category: 'breaking-change',
          message: `Entity '${name}' was removed between ontology versions`,
          source: `entity:${name}`,
        });
      }
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private calculateDriftScore(findings: VerificationFinding[]): number {
    const breaking = findings.filter((f) => f.severity === 'error').length;
    const changes = findings.length;
    if (changes === 0) return 0;
    return Math.round((breaking / changes) * 100);
  }

  private isLayerArtifact(layer: LayerType, artifactType: ArtifactType): boolean {
    return this.getLayerArtifactTypes(layer).includes(artifactType);
  }

  private getLayerArtifactTypes(layer: LayerType): ArtifactType[] {
    const mapping: Record<LayerType, ArtifactType[]> = {
      ontology: ['ontology-class', 'ontology-property', 'ontology-relationship'],
      database: ['database-table', 'database-column', 'database-constraint'],
      api: ['api-endpoint', 'api-schema'],
      frontend: ['ui-view', 'ui-field'],
      ai: ['ai-tool'],
      tests: ['test-case'],
      docs: ['documentation-page'],
      deployment: ['deployment-service'],
      monitoring: [],
      analytics: ['analytics-kpi'],
      requirements: [],
    };
    return mapping[layer] || [];
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Convenience: Run verification on a compiled IR
// ────────────────────────────────────────────────────────────────────────────

export async function verifySemanticModel(
  ir: SemanticModelIR,
  options: VerificationOptions = {},
): Promise<VerificationResult> {
  const registry = new ArtifactRegistry();

  // Populate registry with whatever manifests exist in the IR
  if (ir.traceability.length > 0) {
    // Build a synthetic manifest from traceability links for verification purposes
    const manifest: ArtifactManifest = {
      builderId: 'verification',
      builderVersion: '0.1.0',
      builtAt: new Date().toISOString(),
      ontologyVersion: ir.ontologyVersion,
      irVersion: ir.irVersion,
      artifacts: [],
      checksums: {},
      traceLinks: ir.traceability,
      warnings: [],
    };
    registry.recordBuild('verify-build', [manifest]);
  }

  const engine = new VerificationEngine(ir, options, registry);
  return engine.verify();
}
