/**
 * Builder Engine — the orchestration framework for all 16 builders.
 *
 * Each builder implements the Builder interface. The BuilderEngine
 * resolves the dependency DAG, executes builders in order, and collects
 * artifact manifests and diagnostics.
 */
import type { OntologyEngine } from '@/lib/ontology/engine';
import crypto from 'crypto';
import type {
  SemanticModelIR,
  ArtifactManifest,
  CompilerDiagnostic,
  TraceLinkIR,
} from '../ir/types';
import type { BuildContext, BuildConfig, BuildState, SemanticAnnotations, LegacyEntityMapping } from './build-context';
import { SemanticCompiler } from '../compiler/ir-builder';
import { MappingRegistry } from '../registry/mapping-registry';

// ════════════════════════════════════════════════════════════════════════════
// Builder Interface
// ════════════════════════════════════════════════════════════════════════════

export interface Builder {
  /** Unique builder identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Builder version */
  version: string;
  /** Builders that must complete before this one starts */
  dependsOn: string[];

  /**
   * Execute the builder.
   * Receives a BuildContext and should:
   * 1. Read from context.getIR()
   * 2. Produce artifacts
   * 3. Call context.updateIR() to contribute to the model
   * 4. Return an ArtifactManifest describing what was built
   */
  build(ctx: BuildContext): Promise<ArtifactManifest>;

  /**
   * Optional verification step.
   * Runs after build() to verify the builder's output is consistent.
   */
  verify?(ctx: BuildContext, manifest: ArtifactManifest): Promise<CompilerDiagnostic[]>;
}

// ════════════════════════════════════════════════════════════════════════════
// Builder Registry — holds all registered builders
// ════════════════════════════════════════════════════════════════════════════

export class BuilderRegistry {
  private builders = new Map<string, Builder>();

  register(builder: Builder): void {
    if (this.builders.has(builder.id)) {
      throw new Error(`Builder '${builder.id}' is already registered`);
    }
    this.builders.set(builder.id, builder);
  }

  get(id: string): Builder | undefined {
    return this.builders.get(id);
  }

  getAll(): Builder[] {
    return Array.from(this.builders.values());
  }

  /** Get builders in topological order based on dependency graph */
  getExecutionOrder(): Builder[] {
    const all = this.getAll();
    const visited = new Set<string>();
    const order: Builder[] = [];
    const visiting = new Set<string>();

    const visit = (builder: Builder) => {
      if (visited.has(builder.id)) return;
      if (visiting.has(builder.id)) {
        throw new Error(`Circular dependency detected involving builder '${builder.id}'`);
      }
      visiting.add(builder.id);

      for (const depId of builder.dependsOn) {
        const dep = this.builders.get(depId);
        if (!dep) {
          throw new Error(`Builder '${builder.id}' depends on unknown builder '${depId}'`);
        }
        visit(dep);
      }

      visiting.delete(builder.id);
      visited.add(builder.id);
      order.push(builder);
    };

    for (const builder of all) {
      visit(builder);
    }

    return order;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Builder Engine — orchestrates the full build pipeline
// ════════════════════════════════════════════════════════════════════════════

export class BuilderEngine {
  private registry: BuilderRegistry;
  private ontology: OntologyEngine;
  private annotations: SemanticAnnotations;
  private legacyMappings: Record<string, LegacyEntityMapping>;
  /**
   * Use the SemanticCompiler instead of duplicating ontology → IR logic.
   * The compiler is the single source of truth for ontology compilation.
   */
  private compiler: SemanticCompiler;

  constructor(
    ontology: OntologyEngine,
    annotations: SemanticAnnotations,
    legacyMappings: Record<string, LegacyEntityMapping> = {},
  ) {
    this.registry = new BuilderRegistry();
    this.ontology = ontology;
    this.annotations = annotations;
    this.legacyMappings = legacyMappings;

    // Use the SemanticCompiler — single source of truth for IR compilation
    const mappingRegistry = new MappingRegistry();
    for (const mapping of Object.values(legacyMappings)) {
      mappingRegistry.register(mapping);
    }
    this.compiler = new SemanticCompiler(ontology, annotations, mappingRegistry);
  }

  /** Register a builder */
  register(builder: Builder): void {
    this.registry.register(builder);
  }

  /** Run the full build pipeline */
  async runBuild(config: BuildConfig = {}): Promise<BuildResult> {
    const startedAt = new Date().toISOString();
    const buildId = `build-${Date.now()}-${crypto.randomUUID()}`;

    // Use the SemanticCompiler to build the initial IR
    // This ensures single source of truth for ontology → IR transformation
    const compileResult = await this.compiler.compile();
    const initialIR = compileResult.ir;

    const buildState: BuildState = {
      startedAt,
      buildId,
      config,
      ir: initialIR,
      manifests: new Map(),
      diagnostics: [...compileResult.diagnostics],
      failed: !compileResult.success,
    };

    const ctx = this.createContext(buildState);

    try {
      // Resolve execution order
      let builders: Builder[];
      try {
        builders = this.registry.getExecutionOrder();
      } catch (err) {
        ctx.addDiagnostic({
          severity: 'error',
          message: `Build graph resolution failed: ${(err as Error).message}`,
          source: 'orchestration',
        });
        buildState.failed = true;
        return this.buildResult(buildState);
      }

      // Filter builders if specified
      if (config.builders && config.builders.length > 0) {
        const selectedIds = new Set(config.builders);
        builders = builders.filter((b) => selectedIds.has(b.id));
      }

      // Execute builders in topological order
      for (const builder of builders) {
        if (buildState.failed) break;

        ctx.addDiagnostic({
          severity: 'info',
          message: `Running builder: ${builder.name} (${builder.id})`,
          source: 'orchestration',
        });

        try {
          const manifest = await builder.build(ctx);
          ctx.registerManifest(builder.id, manifest);

          // Optionally verify
          if (builder.verify) {
            const verifyDiags = await builder.verify(ctx, manifest);
            for (const diag of verifyDiags) {
              ctx.addDiagnostic(diag);
              if (diag.severity === 'error') {
                buildState.failed = true;
              }
            }
          }
        } catch (err) {
          ctx.addDiagnostic({
            severity: 'error',
            message: `Builder '${builder.id}' failed: ${(err as Error).message}`,
            source: 'orchestration',
          });
          buildState.failed = true;
        }
      }
    } catch (err) {
      ctx.addDiagnostic({
        severity: 'error',
        message: `Build failed: ${(err as Error).message}`,
        source: 'orchestration',
      });
      buildState.failed = true;
    }

    return this.buildResult(buildState);
  }

  /** Create a BuildContext from state */
  private createContext(state: BuildState): BuildContext {
    return {
      state,
      ontology: this.ontology,
      annotations: this.annotations,
      legacyMappings: this.legacyMappings,
      addDiagnostic(diag) {
        state.diagnostics.push(diag);
      },
      getIR() {
        return state.ir;
      },
      updateIR(update) {
        Object.assign(state.ir, update);
      },
      registerManifest(builderId, manifest) {
        state.manifests.set(builderId, manifest);
      },
      fail(error) {
        state.failed = true;
        state.error = error;
      },
      isFailed() {
        return state.failed;
      },
    };
  }

  /** Build final result from state */
  private buildResult(state: BuildState): BuildResult {
    const errors = state.diagnostics.filter((d) => d.severity === 'error');
    const warnings = state.diagnostics.filter((d) => d.severity === 'warning');

    return {
      buildId: state.buildId,
      success: !state.failed && errors.length === 0,
      failed: state.failed,
      duration: Date.now() - new Date(state.startedAt).getTime(),
      ir: state.ir,
      manifests: Array.from(state.manifests.values()),
      diagnostics: state.diagnostics,
      errors,
      warnings,
      error: state.error,
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Build Result
// ════════════════════════════════════════════════════════════════════════════

export interface BuildResult {
  /** Build ID */
  buildId: string;
  /** Whether the build succeeded */
  success: boolean;
  /** Whether the build failed */
  failed: boolean;
  /** Duration in milliseconds */
  duration: number;

  /** Final semantic IR */
  ir: SemanticModelIR;
  /** Manifests from each builder */
  manifests: ArtifactManifest[];

  /** All diagnostics */
  diagnostics: CompilerDiagnostic[];
  /** Only errors */
  errors: CompilerDiagnostic[];
  /** Only warnings */
  warnings: CompilerDiagnostic[];

  /** Error object if build failed */
  error?: Error;
}
