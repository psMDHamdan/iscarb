/**
 * Annotation Processor — extracts platform-specific annotations from ontology
 * classes and properties.
 *
 * Annotations can come from:
 * 1. OWL annotation properties on classes/properties
 * 2. Separate annotation TTL files (ontology/profiles/*.ttl)
 * 3. JSON metadata files
 * 4. Default conventions derived from ontology structure
 */
import type { OntologyEngine } from '@/lib/ontology/engine';
import type {
  SemanticAnnotations,
  EntityAnnotation,
  PropertyAnnotation,
  RelationshipAnnotation,
} from '../orchestration/build-context';

// ────────────────────────────────────────────────────────────────────────────
// Annotation Sources
// ────────────────────────────────────────────────────────────────────────────

export interface AnnotationSource {
  /** Source name for diagnostics */
  name: string;
  /** Priority (higher = overrides lower) */
  priority: number;
  /** Load annotations from this source */
  load(): Promise<Partial<SemanticAnnotations>>;
}

// ────────────────────────────────────────────────────────────────────────────
// Annotation Processor
// ────────────────────────────────────────────────────────────────────────────

export class AnnotationProcessor {
  private sources: AnnotationSource[] = [];
  private ontology: OntologyEngine;

  constructor(ontology: OntologyEngine) {
    this.ontology = ontology;
  }

  /** Register an annotation source */
  addSource(source: AnnotationSource): void {
    this.sources.push(source);
  }

  /** Load and merge annotations from all sources in priority order */
  async loadAnnotations(): Promise<SemanticAnnotations> {
    const merged: SemanticAnnotations = {
      entities: {},
      properties: {},
      relationships: {},
    };

    // Start with default conventions from ontology structure
    this.applyDefaults(merged);

    // Sort sources by priority (ascending) and apply
    const sorted = [...this.sources].sort((a, b) => a.priority - b.priority);
    for (const source of sorted) {
      try {
        const partial = await source.load();
        this.mergeAnnotations(merged, partial);
      } catch (err) {
        console.warn(`Annotation source '${source.name}' failed:`, err);
      }
    }

    return merged;
  }

  /** Apply default annotation conventions based on ontology structure */
  private applyDefaults(annotations: SemanticAnnotations): void {
    for (const [, cls] of this.ontology.classes) {
      const entityAnn: EntityAnnotation = {
        ui: {
          listFields: ['name', 'email', 'status'],
          searchFields: ['name', 'email'],
          defaultSort: 'name',
        },
        db: {
          storageStrategy: 'table',
          historyRetentionDays: 365,
        },
        api: {
          generateCRUD: true,
          generateSearch: true,
          auditLogged: true,
          rdfSyncEnabled: true,
        },
        search: {
          searchableFields: [],
          filterableFields: [],
          sortableFields: ['name', 'createdAt'],
          fullTextFields: [],
          vectorizedFields: [],
        },
        permissions: {
          createRoles: ['admin'],
          readRoles: ['admin', 'faculty', 'student'],
          updateRoles: ['admin', 'faculty'],
          deleteRoles: ['admin'],
        },
        analytics: {
          tracked: true,
          metrics: ['COUNT(*)'],
          dimensions: ['createdAt'],
        },
      };

      // Derive from ontology property structure
      const dtProps = this.ontology.datatypeProperties;
      const nameProp = [...dtProps.values()].find((p) => p.domain === cls.id && p.name === 'name');
      const emailProp = [...dtProps.values()].find((p) => p.domain === cls.id && p.name === 'email');

      if (nameProp) {
        entityAnn.ui!.listFields = ['name'];
        entityAnn.ui!.searchFields = ['name'];
      }
      if (emailProp) {
        entityAnn.ui!.listFields?.push('email');
        entityAnn.ui!.searchFields?.push('email');
      }

      annotations.entities[cls.id] = entityAnn;
    }

    // Default property annotations
    for (const [, prop] of this.ontology.datatypeProperties) {
      const propAnn: PropertyAnnotation = {
        indexed: prop.required,
        fullText: prop.datatype === 'text',
        vectorized: false,
        uiWidget: this.mapWidget(prop.datatype),
        uiReadOnly: ['createdAt', 'updatedAt'].includes(prop.name),
      };

      // Name fields should be searchable
      if (prop.name === 'name' || prop.name === 'title') {
        propAnn.fullText = true;
        propAnn.indexed = true;
      }

      annotations.properties[prop.id] = propAnn;
    }

    // Default relationship annotations
    for (const [, prop] of this.ontology.objectProperties) {
      annotations.relationships[prop.id] = {
        exposedInUI: true,
        exposedInApi: true,
        storageStrategy: 'foreign-key',
      };
    }
  }

  /** Deep-merge two annotation sets */
  private mergeAnnotations(
    base: SemanticAnnotations,
    overlay: Partial<SemanticAnnotations>,
  ): void {
    if (overlay.entities) {
      for (const [key, value] of Object.entries(overlay.entities)) {
        if (value) {
          base.entities[key] = this.deepMerge(base.entities[key] || {}, value);
        }
      }
    }
    if (overlay.properties) {
      for (const [key, value] of Object.entries(overlay.properties)) {
        if (value) {
          base.properties[key] = { ...base.properties[key], ...value };
        }
      }
    }
    if (overlay.relationships) {
      for (const [key, value] of Object.entries(overlay.relationships)) {
        if (value) {
          base.relationships[key] = { ...base.relationships[key], ...value };
        }
      }
    }
  }

  private deepMerge<T extends Record<string, any>>(base: T, overlay: Partial<T>): T {
    const result = { ...base };
    for (const [key, value] of Object.entries(overlay)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        (result as any)[key] = this.deepMerge((base as any)[key] || {}, value);
      } else if (value !== undefined) {
        (result as any)[key] = value;
      }
    }
    return result;
  }

  private mapWidget(datatype: string): string {
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
// Pre-built annotation sources
// ────────────────────────────────────────────────────────────────────────────

/** JSON file annotation source */
export function jsonFileAnnotationSource(
  path: string,
  priority: number = 50,
): AnnotationSource {
  return {
    name: `json-file:${path}`,
    priority,
    async load(): Promise<Partial<SemanticAnnotations>> {
      // In a real setup, read and parse the JSON file
      return {};
    },
  };
}

/** Convention-based annotation source */
export function conventionAnnotationSource(
  ontology: OntologyEngine,
  priority: number = 100,
): AnnotationSource {
  return {
    name: 'conventions',
    priority,
    async load(): Promise<Partial<SemanticAnnotations>> {
      // Additional conventions beyond defaults
      return {};
    },
  };
}
