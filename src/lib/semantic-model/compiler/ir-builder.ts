/**
 * Semantic Compiler / IR Builder — the core of the semantic control plane.
 *
 * Transforms the OntologyEngine + Annotations → SemanticModelIR.
 * This IR is the unified contract consumed by all 16 builders.
 *
 * The compiler:
 * 1. Parses the ontology
 * 2. Resolves inheritance
 * 3. Applies annotations
 * 4. Validates constraints
 * 5. Produces the SemanticModelIR
 * 6. Generates traceability links
 */
import { OntologyEngine } from '@/lib/ontology/engine';
import {
  AnnotationProcessor,
  type AnnotationSource,
} from './annotations';
import { MappingRegistry } from '../registry/mapping-registry';
import type {
  SemanticModelIR,
  EntityIR,
  RelationshipIR,
  PropertyIR,
  TraceLinkIR,
  CompilerDiagnostic,
} from '../ir/types';
import type { SemanticAnnotations, LegacyEntityMapping } from '../orchestration/build-context';

// ────────────────────────────────────────────────────────────────────────────
// Compiler Options
// ────────────────────────────────────────────────────────────────────────────

export interface CompilerOptions {
  /** Whether to run in strict mode (fail on warnings) */
  strict?: boolean;
  /** Whether to generate traceability links */
  generateTraceability?: boolean;
  /** Whether to resolve inherited properties */
  resolveInheritance?: boolean;
  /** Whether to include diagnostics in the IR */
  includeDiagnostics?: boolean;
  /** Extra annotation sources */
  annotationSources?: AnnotationSource[];
}

const DEFAULT_OPTIONS: CompilerOptions = {
  strict: false,
  generateTraceability: true,
  resolveInheritance: true,
  includeDiagnostics: true,
  annotationSources: [],
};

// ────────────────────────────────────────────────────────────────────────────
// Compiler Result
// ────────────────────────────────────────────────────────────────────────────

export interface CompilerResult {
  /** The compiled IR */
  ir: SemanticModelIR;
  /** Whether compilation succeeded */
  success: boolean;
  /** Diagnostics (errors and warnings) */
  diagnostics: CompilerDiagnostic[];
  /** Duration in milliseconds */
  durationMs: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Semantic Compiler
// ────────────────────────────────────────────────────────────────────────────

export class SemanticCompiler {
  private ontology: OntologyEngine;
  private annotations: SemanticAnnotations;
  private mappingRegistry: MappingRegistry;
  private options: CompilerOptions;

  constructor(
    ontology: OntologyEngine,
    annotations: SemanticAnnotations,
    mappingRegistry: MappingRegistry,
    options: CompilerOptions = {},
  ) {
    this.ontology = ontology;
    this.annotations = annotations;
    this.mappingRegistry = mappingRegistry;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Compile the ontology into a SemanticModelIR.
   * This is the main entry point.
   */
  async compile(): Promise<CompilerResult> {
    const startTime = Date.now();
    const diagnostics: CompilerDiagnostic[] = [];

    // Validate the ontology first
    const validation = this.ontology.validate();
    for (const error of validation.errors) {
      diagnostics.push({
        severity: 'error',
        message: error.message,
        path: error.path,
        source: 'ontology',
      });
    }
    for (const warning of validation.warnings) {
      diagnostics.push({
        severity: 'warning',
        message: warning.message,
        path: warning.path,
        source: 'ontology',
      });
    }

    if (validation.errors.length > 0) {
      // Still compile, but mark errors
      diagnostics.push({
        severity: 'warning',
        message: `Ontology has ${validation.errors.length} validation error(s) — continuing with best-effort compilation`,
        source: 'compiler',
      });
    }

    // Build the IR
    const ir: SemanticModelIR = {
      irVersion: '0.1.0',
      ontologyVersion: this.ontology.version,
      compiledAt: new Date().toISOString(),
      namespaces: Object.fromEntries(this.ontology.namespaces),
      entities: [],
      relationships: [],
      properties: [],
      workflows: [],
      permissions: [],
      requirements: [],
      views: [],
      api: [],
      analytics: [],
      deployment: [],
      tests: [],
      traceability: [],
      diagnostics: this.options.includeDiagnostics ? [...diagnostics] : [],
    };

    // Phase 1: Convert ontology classes → EntityIR
    this.compileEntities(ir, diagnostics);

    // Phase 2: Convert object properties → RelationshipIR
    this.compileRelationships(ir, diagnostics);

    // Phase 2.5: Link relationships to their domain/range entities
    for (const rel of ir.relationships) {
      const domainEntity = ir.entities.find(e => e.name === rel.domain);
      const rangeEntity = ir.entities.find(e => e.name === rel.range);
      if (domainEntity) {
        domainEntity.outgoingRelationships.push({
          relationshipId: rel.id,
          name: rel.name,
          targetEntity: rel.range,
          cardinality: rel.cardinality,
        });
      }
      if (rangeEntity) {
        rangeEntity.incomingRelationships.push({
          relationshipId: rel.id,
          name: rel.name,
          targetEntity: rel.domain,
          cardinality: rel.cardinality,
        });
      }
    }

    // Phase 3: Convert datatype properties → PropertyIR
    this.compileProperties(ir, diagnostics);

    // Phase 3.5: Link properties to their owning entities via domain
    for (const prop of ir.properties) {
      const entity = ir.entities.find(e => e.name === prop.domain);
      if (entity) {
        entity.ownedProperties.push({
          propertyId: prop.id,
          name: prop.name,
        });
      }
    }

    // Phase 4: Resolve inheritance (flatten inherited properties)
    if (this.options.resolveInheritance) {
      this.resolveInheritance(ir);
    }

    // Phase 5: Apply annotations to enrich the IR
    this.applyAnnotations(ir);

    // Phase 6: Generate traceability links
    if (this.options.generateTraceability) {
      this.generateTraceability(ir, diagnostics);
    }

    // Phase 7: Apply legacy mappings where appropriate
    this.applyLegacyMappings(ir, diagnostics);

    // Compute final validation
    const success = diagnostics.filter((d) => d.severity === 'error').length === 0;

    if (this.options.strict && diagnostics.filter((d) => d.severity === 'warning').length > 0) {
      // In strict mode, warnings also prevent success
    }

    return {
      ir,
      success,
      diagnostics,
      durationMs: Date.now() - startTime,
    };
  }

  // ─── Phase 1: Entities ─────────────────────────────────────────────

  private compileEntities(ir: SemanticModelIR, diagnostics: CompilerDiagnostic[]): void {
    for (const [, cls] of this.ontology.classes) {
      const ancestors = this.resolveAncestors(cls.id);
      const entityAnn = this.annotations.entities[cls.id];

      // Determine projection mode from annotation or mapping registry
      const legacyMapping = this.mappingRegistry.getByOntologyClass(cls.id);
      const projectionMode = legacyMapping ? 'legacy-mapped' : 'generated-greenfield';
      const migrationStage = legacyMapping ? 'mapped' : 'greenfield';

      const entity: EntityIR = {
        name: cls.id,
        label: cls.label,
        description: cls.description,
        parentClass: cls.parentClass,
        ancestorClasses: ancestors,
        inheritedProperties: [],
        projectionMode: projectionMode as any,
        authority: 'database',
        migrationStage: migrationStage as any,
        ownedProperties: [],
        outgoingRelationships: [],
        incomingRelationships: [],
        restrictions: (cls.restrictions || []).map((r) => ({
          type: r.type as any,
          property: r.property,
          value: r.value,
        })),
        annotations: entityAnn ? { ...entityAnn } as any : {},
        equivalentClasses: cls.equivalentClasses || [],
        disjointWith: cls.disjointWith || [],
        versionInfo: cls.versionInfo || `v${this.ontology.version}`,
      };

      ir.entities.push(entity);
    }
  }

  // ─── Phase 2: Relationships ─────────────────────────────────────────

  private compileRelationships(ir: SemanticModelIR, diagnostics: CompilerDiagnostic[]): void {
    for (const [, prop] of this.ontology.objectProperties) {
      const cardinality = this.resolveCardinality(prop);
      const relAnn = this.annotations.relationships[prop.id];

      // Validate domain and range exist
      if (!ir.entities.find((e) => e.name === prop.domain)) {
        diagnostics.push({
          severity: 'error',
          message: `Relationship '${prop.id}' references unknown domain class '${prop.domain}'`,
          source: 'compiler',
        });
        continue;
      }
      if (!ir.entities.find((e) => e.name === prop.range)) {
        diagnostics.push({
          severity: 'error',
          message: `Relationship '${prop.id}' references unknown range class '${prop.range}'`,
          source: 'compiler',
        });
        continue;
      }

      const relationship: RelationshipIR = {
        id: prop.id,
        name: prop.name,
        label: prop.name,
        domain: prop.domain,
        range: prop.range,
        inverse: prop.inverse,
        characteristics: prop.characteristics,
        subPropertyOf: prop.subPropertyOf,
        cardinality,
        minCardinality: prop.minCardinality,
        maxCardinality: prop.maxCardinality,
        storageStrategy: cardinality === 'many-to-many' ? 'join-table' : 'foreign-key',
        exposedInApi: relAnn?.exposedInApi ?? true,
        exposedInUI: relAnn?.exposedInUI ?? true,
        annotations: {},
      };

      ir.relationships.push(relationship);
    }
  }

  // ─── Phase 3: Properties ────────────────────────────────────────────

  private compileProperties(ir: SemanticModelIR, diagnostics: CompilerDiagnostic[]): void {
    for (const [, prop] of this.ontology.datatypeProperties) {
      const propAnn = this.annotations.properties[prop.id];

      // Validate domain exists
      if (!ir.entities.find((e) => e.name === prop.domain)) {
        diagnostics.push({
          severity: 'warning',
          message: `Property '${prop.id}' references unknown domain class '${prop.domain}'. Attempting to find entity...`,
          source: 'compiler',
        });
        continue;
      }

      const sqlType = this.mapDatatypeToSQL(prop.datatype);
      const uiWidget = propAnn?.uiWidget || this.mapDatatypeToWidget(prop.datatype);

      const property: PropertyIR = {
        id: prop.id,
        name: prop.name,
        label: prop.name,
        domain: prop.domain,
        datatype: prop.datatype as any,
        required: prop.required,
        defaultValue: prop.defaultValue,
        minLength: prop.minLength,
        maxLength: prop.maxLength,
        pattern: prop.pattern,
        unit: prop.unit,
        sqlType,
        sqlNullable: !prop.required,
        sqlUnique: false,
        sqlIndexed: propAnn?.indexed ?? (prop.required && prop.name !== 'id'),
        sqlDefault: prop.defaultValue,
        searchable: propAnn?.fullText ?? (prop.datatype === 'text' || prop.name === 'name'),
        filterable: prop.required,
        sortable: prop.name !== 'description' && prop.name !== 'content',
        fullText: propAnn?.fullText ?? prop.datatype === 'text',
        vectorized: propAnn?.vectorized ?? false,
        uiWidget: uiWidget as any,
        uiSection: propAnn?.uiSection,
        uiOrder: propAnn?.uiOrder,
        uiReadOnly: propAnn?.uiReadOnly ?? ['createdAt', 'updatedAt'].includes(prop.name),
        exposedInApi: true,
        apiWritable: !['createdAt', 'updatedAt'].includes(prop.name),
        annotations: {},
      };

      ir.properties.push(property);
    }
  }

  // ─── Phase 4: Inheritance Resolution ────────────────────────────────

  private resolveInheritance(ir: SemanticModelIR): void {
    for (const entity of ir.entities) {
      const inheritedProps: string[] = [];

      if (entity.parentClass) {
        const parent = ir.entities.find((e) => e.name === entity.parentClass);
        if (parent) {
          // Copy parent's owned properties to child's inherited
          for (const prop of parent.ownedProperties) {
            if (!entity.ownedProperties.find((p) => p.propertyId === prop.propertyId)) {
              inheritedProps.push(prop.propertyId);
            }
          }
          // Also inherit from grandparent
          for (const ancestor of entity.ancestorClasses) {
            const ancEntity = ir.entities.find((e) => e.name === ancestor);
            if (ancEntity) {
              for (const prop of ancEntity.ownedProperties) {
                if (!entity.ownedProperties.find((p) => p.propertyId === prop.propertyId)
                    && !inheritedProps.includes(prop.propertyId)) {
                  inheritedProps.push(prop.propertyId);
                }
              }
            }
          }
        }
      }

      entity.inheritedProperties = inheritedProps;
    }
  }

  // ─── Phase 5: Apply Annotations ─────────────────────────────────────

  private applyAnnotations(ir: SemanticModelIR): void {
    for (const entity of ir.entities) {
      const ann = this.annotations.entities[entity.name];
      if (!ann) continue;

      // Apply permission annotations
      if (ann.permissions) {
        const existingPerm = ir.permissions.find((p) => p.entity === entity.name);
        if (!existingPerm) {
          ir.permissions.push({
            id: `perm_${entity.name}`,
            name: `${entity.name}Permissions`,
            label: `${entity.label} Permissions`,
            entity: entity.name,
            actions: ['create', 'read', 'update', 'delete'],
            roles: ann.permissions.readRoles || ['admin'],
            annotations: {},
          });
        }
      }

      // Apply API annotations
      if (ann.api?.generateCRUD !== false) {
        ir.api.push({
          id: `api_${entity.name}_list`,
          method: 'GET',
          path: `/api/v1/generated/${entity.name.toLowerCase()}s`,
          entity: entity.name,
          description: `List ${entity.label} entities`,
          protocol: 'rest',
          parameters: [{ name: 'page', in: 'query', required: false, type: 'integer' }],
          requiredPermissions: ann.permissions?.readRoles || ['admin'],
          annotations: {},
        });
      }
    }

    // Apply annotation-based property metadata
    for (const prop of ir.properties) {
      const ann = this.annotations.properties[prop.id];
      if (!ann) continue;

      if (ann.uiWidget) (prop.uiWidget as any) = ann.uiWidget;
      if (ann.uiReadOnly !== undefined) prop.uiReadOnly = ann.uiReadOnly;
      if (ann.indexed !== undefined) prop.sqlIndexed = ann.indexed;
      if (ann.fullText !== undefined) prop.fullText = ann.fullText;
      if (ann.vectorized !== undefined) prop.vectorized = ann.vectorized;
    }

    // Apply annotation-based relationship metadata
    for (const rel of ir.relationships) {
      const ann = this.annotations.relationships[rel.id];
      if (!ann) continue;

      if (ann.exposedInApi !== undefined) rel.exposedInApi = ann.exposedInApi;
      if (ann.exposedInUI !== undefined) rel.exposedInUI = ann.exposedInUI;
      if (ann.storageStrategy) rel.storageStrategy = ann.storageStrategy;
    }
  }

  // ─── Phase 6: Traceability ──────────────────────────────────────────

  private generateTraceability(ir: SemanticModelIR, diagnostics: CompilerDiagnostic[]): void {
    const now = new Date().toISOString();
    const links: TraceLinkIR[] = [];

    for (const entity of ir.entities) {
      // Entity → Property links
      for (const propRef of entity.ownedProperties) {
        links.push({
          id: `trace_${entity.name}_${propRef.propertyId}`,
          sourceType: 'ontology-class',
          sourceId: entity.name,
          targetType: 'ontology-property',
          targetId: propRef.propertyId,
          relation: 'derives',
          confidence: 1.0,
          createdAt: now,
        });
      }

      // Entity → Relationship links
      for (const relRef of entity.outgoingRelationships) {
        links.push({
          id: `trace_${entity.name}_${relRef.relationshipId}`,
          sourceType: 'ontology-class',
          sourceId: entity.name,
          targetType: 'ontology-relationship',
          targetId: relRef.relationshipId,
          relation: 'derives',
          confidence: 1.0,
          createdAt: now,
        });
      }
    }

    // Legacy mapping traceability
    for (const mapping of this.mappingRegistry.getAll()) {
      links.push({
        id: `trace_map_${mapping.ontologyClass}`,
        sourceType: 'ontology-class',
        sourceId: mapping.ontologyClass,
        targetType: 'database-table',
        targetId: mapping.prismaModel,
        relation: 'implements',
        confidence: mapping.mappingConfidence,
        createdAt: now,
      });
    }

    ir.traceability = links;
  }

  // ─── Phase 7: Legacy Mappings ──────────────────────────────────────

  private applyLegacyMappings(ir: SemanticModelIR, diagnostics: CompilerDiagnostic[]): void {
    for (const mapping of this.mappingRegistry.getAll()) {
      const entity = ir.entities.find((e) => e.name === mapping.ontologyClass);
      if (!entity) {
        diagnostics.push({
          severity: 'warning',
          message: `Legacy mapping references unknown ontology class '${mapping.ontologyClass}'`,
          source: 'mapping',
        });
        continue;
      }

      entity.projectionMode = 'legacy-mapped';
      entity.migrationStage = 'mapped';
      entity.authority = 'database';
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private resolveAncestors(classId: string): string[] {
    const ancestors: string[] = [];
    const visited = new Set<string>();
    let current = classId;

    while (current) {
      if (visited.has(current)) break;
      visited.add(current);
      const cls = this.ontology.classes.get(current);
      if (cls?.parentClass) {
        ancestors.push(cls.parentClass);
        current = cls.parentClass;
      } else {
        break;
      }
    }

    return ancestors;
  }

  private resolveCardinality(prop: { characteristics: string[]; minCardinality?: number; maxCardinality?: number }): 'one-to-one' | 'one-to-many' | 'many-to-many' {
    const isFunc = prop.characteristics.includes('functional');
    const isInvFunc = prop.characteristics.includes('inverseFunctional');
    const isTrans = prop.characteristics.includes('transitive');

    if (isFunc && isInvFunc) return 'one-to-one';
    if (prop.maxCardinality === 1) return 'one-to-one';
    if (isFunc) return 'one-to-many'; // domain side is functional → range side has many
    if (isTrans) return 'many-to-many';
    return 'one-to-many';
  }

  private mapDatatypeToSQL(datatype: string): string {
    const map: Record<string, string> = {
      string: 'TEXT',
      integer: 'INTEGER',
      float: 'NUMERIC(10,4)',
      boolean: 'BOOLEAN',
      date: 'DATE',
      datetime: 'TIMESTAMPTZ',
      text: 'TEXT',
      json: 'JSONB',
    };
    return map[datatype] || 'TEXT';
  }

  private mapDatatypeToWidget(datatype: string): string {
    const map: Record<string, string> = {
      string: 'text',
      integer: 'number',
      float: 'number',
      boolean: 'checkbox',
      date: 'date',
      datetime: 'datetime',
      text: 'textarea',
      json: 'json-editor',
    };
    return map[datatype] || 'text';
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Convenience: Full compilation pipeline
// ────────────────────────────────────────────────────────────────────────────

/**
 * Run the full compilation pipeline from an OntologyEngine.
 *
 * @param ontology The ontology engine to compile from
 * @param options Compiler options
 * @param annotationSources Extra annotation sources
 * @param mappings Pre-registered legacy mappings (optional)
 */
export async function compileOntology(
  ontology: OntologyEngine,
  options: CompilerOptions = {},
  annotationSources: AnnotationSource[] = [],
  mappings: LegacyEntityMapping[] = [],
): Promise<CompilerResult> {
  // 1. Process annotations
  const annotationProcessor = new AnnotationProcessor(ontology);
  for (const source of annotationSources) {
    annotationProcessor.addSource(source);
  }
  const annotations = await annotationProcessor.loadAnnotations();

  // 2. Set up mapping registry
  const mappingRegistry = new MappingRegistry();
  mappingRegistry.registerMany(mappings);

  // 3. Create compiler and compile
  const compiler = new SemanticCompiler(ontology, annotations, mappingRegistry, {
    ...options,
    annotationSources,
  });

  return compiler.compile();
}
