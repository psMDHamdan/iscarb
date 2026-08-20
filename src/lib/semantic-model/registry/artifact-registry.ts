/**
 * Artifact Registry — stores build artifact manifests and enables
 * change detection, drift analysis, and historical comparison.
 *
 * Each build produces a set of artifact manifests. The registry
 * tracks them by ontology version and build ID.
 */
import type { ArtifactManifest, ArtifactEntry } from '../ir/types';
import type { ArtifactSnapshot, DriftReport, DriftChangeIR } from '../ir/trace-ir';

// ────────────────────────────────────────────────────────────────────────────
// Artifact Registry
// ────────────────────────────────────────────────────────────────────────────

export class ArtifactRegistry {
  /** Manifests indexed by build ID */
  private builds = new Map<string, BuildRecord>();

  /** Latest manifest per builder ID */
  private latestManifests = new Map<string, ArtifactManifest>();

  /** All artifacts ever produced, indexed by artifactId */
  private allArtifacts = new Map<string, ArtifactRecord>();

  constructor() {}

  /** Record a completed build */
  recordBuild(buildId: string, manifests: ArtifactManifest[]): void {
    const record: BuildRecord = {
      buildId,
      timestamp: new Date().toISOString(),
      manifests: [...manifests],
    };
    this.builds.set(buildId, record);

    for (const manifest of manifests) {
      this.latestManifests.set(manifest.builderId, manifest);

      for (const artifact of manifest.artifacts) {
        this.allArtifacts.set(artifact.artifactId, {
          artifact,
          manifest,
          buildId,
          timestamp: record.timestamp,
        });
      }
    }
  }

  /** Get the latest manifest for a builder */
  getLatestManifest(builderId: string): ArtifactManifest | undefined {
    return this.latestManifests.get(builderId);
  }

  /** Get all manifests for a specific build */
  getBuildManifests(buildId: string): ArtifactManifest[] | undefined {
    return this.builds.get(buildId)?.manifests;
  }

  /** Get the latest snapshot of all artifacts */
  getLatestSnapshot(): ArtifactSnapshot {
    const manifests = Array.from(this.latestManifests.values());
    return this.buildSnapshot(manifests);
  }

  /** Get a snapshot for a specific build */
  getBuildSnapshot(buildId: string): ArtifactSnapshot | undefined {
    const manifests = this.getBuildManifests(buildId);
    if (!manifests) return undefined;
    return this.buildSnapshot(manifests);
  }

  /** Compare two snapshots and produce a drift report */
  compareSnapshots(snapshotA: ArtifactSnapshot, snapshotB: ArtifactSnapshot): DriftReport {
    const changes: DriftChangeIR[] = [];
    const breakingChanges: DriftChangeIR[] = [];

    // Index artifacts by ID for comparison
    const artifactsA = new Map<string, ArtifactEntry>();
    for (const manifest of snapshotA.manifests) {
      for (const artifact of manifest.artifacts) {
        artifactsA.set(artifact.artifactId, artifact);
      }
    }

    const artifactsB = new Map<string, ArtifactEntry>();
    for (const manifest of snapshotB.manifests) {
      for (const artifact of manifest.artifacts) {
        artifactsB.set(artifact.artifactId, artifact);
      }
    }

    // Detect added artifacts
    for (const [id, artifact] of artifactsB) {
      if (!artifactsA.has(id)) {
        const change: DriftChangeIR = {
          type: 'added',
          artifactType: artifact.artifactType,
          artifactId: id,
          description: `Added ${artifact.artifactType}: ${artifact.name}`,
          breaking: false,
        };
        changes.push(change);
      }
    }

    // Detect removed artifacts
    for (const [id, artifact] of artifactsA) {
      if (!artifactsB.has(id)) {
        const change: DriftChangeIR = {
          type: 'removed',
          artifactType: artifact.artifactType,
          artifactId: id,
          description: `Removed ${artifact.artifactType}: ${artifact.name}`,
          breaking: true, // removals are breaking by default
        };
        changes.push(change);
        breakingChanges.push(change);
      }
    }

    // Detect modified artifacts (checksum change)
    for (const [id, artifactB] of artifactsB) {
      const artifactA = artifactsA.get(id);
      if (artifactA && artifactA.checksum !== artifactB.checksum) {
        const isBreaking = artifactA.status !== 'deprecated' && artifactB.status === 'deprecated';
        const change: DriftChangeIR = {
          type: 'modified',
          artifactType: artifactB.artifactType,
          artifactId: id,
          description: `Modified ${artifactB.artifactType}: ${artifactB.name} (${artifactA.status} → ${artifactB.status})`,
          breaking: isBreaking,
        };
        changes.push(change);
        if (isBreaking) breakingChanges.push(change);
      }
    }

    // Calculate drift score (0 = no drift, 100 = completely different)
    const totalA = artifactsA.size;
    const totalB = artifactsB.size;
    const totalUnique = new Set([...artifactsA.keys(), ...artifactsB.keys()]).size;
    const totalChanged = changes.length;
    const driftScore = totalUnique > 0
      ? Math.round((totalChanged / totalUnique) * 100)
      : 0;

    return {
      snapshotA,
      snapshotB,
      driftScore,
      changes,
      breakingChanges,
      recommendations: this.generateRecommendations(breakingChanges, changes),
    };
  }

  /** Get the total artifact count */
  getArtifactCount(): number {
    return this.allArtifacts.size;
  }

  /** Get artifacts by type */
  getArtifactsByType(type: string): ArtifactRecord[] {
    return Array.from(this.allArtifacts.values())
      .filter((r) => r.artifact.artifactType === type);
  }

  /** Clear all data */
  clear(): void {
    this.builds.clear();
    this.latestManifests.clear();
    this.allArtifacts.clear();
  }

  // ─── Private Helpers ──────────────────────────────────────────────────

  private buildSnapshot(manifests: ArtifactManifest[]): ArtifactSnapshot {
    return {
      timestamp: new Date().toISOString(),
      manifests,
      traceGraph: {
        ontologyVersion: manifests[0]?.ontologyVersion ?? 0,
        compiledAt: new Date().toISOString(),
        links: manifests.flatMap((m) => m.traceLinks),
        stats: {
          totalLinks: manifests.reduce((s, m) => s + m.traceLinks.length, 0),
          uniqueSources: 0,
          uniqueTargets: 0,
          coverage: {} as any,
          missingLinks: [],
        },
        bySource: {},
        byTarget: {},
        byRelation: {},
      },
      healthScore: this.calculateHealthScore(manifests),
    };
  }

  private calculateHealthScore(manifests: ArtifactManifest[]): number {
    let score = 100;
    let totalArtifacts = 0;
    let issues = 0;

    for (const manifest of manifests) {
      for (const artifact of manifest.artifacts) {
        totalArtifacts++;
        if (artifact.status === 'deprecated') issues += 2;
        if (manifest.warnings.length > 0) issues += manifest.warnings.length;
      }
    }

    if (totalArtifacts > 0) {
      score = Math.max(0, 100 - Math.round((issues / totalArtifacts) * 100));
    }

    return score;
  }

  private generateRecommendations(
    breakingChanges: DriftChangeIR[],
    allChanges: DriftChangeIR[],
  ): string[] {
    const recommendations: string[] = [];

    if (breakingChanges.length > 0) {
      recommendations.push(
        `Review ${breakingChanges.length} breaking change(s) before deploying`,
      );
    }

    const removedDB = allChanges.filter(
      (c) => c.type === 'removed' && c.artifactType === 'database-table',
    );
    if (removedDB.length > 0) {
      recommendations.push(`Data migration needed for ${removedDB.length} removed table(s)`);
    }

    const removedAPI = allChanges.filter(
      (c) => c.type === 'removed' && c.artifactType === 'api-endpoint',
    );
    if (removedAPI.length > 0) {
      recommendations.push(`API version bump needed — ${removedAPI.length} endpoint(s) removed`);
    }

    return recommendations;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Supporting Types
// ────────────────────────────────────────────────────────────────────────────

interface BuildRecord {
  buildId: string;
  timestamp: string;
  manifests: ArtifactManifest[];
}

export interface ArtifactRecord {
  artifact: ArtifactEntry;
  manifest: ArtifactManifest;
  buildId: string;
  timestamp: string;
}

/** Singleton instance */
let _instance: ArtifactRegistry | null = null;
export function getArtifactRegistry(): ArtifactRegistry {
  if (!_instance) _instance = new ArtifactRegistry();
  return _instance;
}
