/**
 * Mapping Registry — bridges ontology classes to existing Prisma models.
 *
 * Enables the platform to work in "legacy-mapped" mode where the ontology
 * is kept in sync with existing database models without requiring generation.
 */
import type { LegacyEntityMapping, LegacyFieldMapping, LegacyRelationshipMapping } from '../orchestration/build-context';

// ────────────────────────────────────────────────────────────────────────────
// Mapping Registry
// ────────────────────────────────────────────────────────────────────────────

export class MappingRegistry {
  /** Entity mappings keyed by ontology class name */
  private entityMappings = new Map<string, LegacyEntityMapping>();

  /** Index by Prisma model name */
  private byPrismaModel = new Map<string, string>(); // prismaModel → ontologyClass

  constructor() {}

  /** Register a mapping between an ontology class and a Prisma model */
  register(mapping: LegacyEntityMapping): void {
    this.entityMappings.set(mapping.ontologyClass, mapping);
    this.byPrismaModel.set(mapping.prismaModel, mapping.ontologyClass);
  }

  /** Register multiple mappings */
  registerMany(mappings: LegacyEntityMapping[]): void {
    for (const m of mappings) {
      this.register(m);
    }
  }

  /** Get mapping by ontology class name */
  getByOntologyClass(className: string): LegacyEntityMapping | undefined {
    return this.entityMappings.get(className);
  }

  /** Get mapping by Prisma model name */
  getByPrismaModel(modelName: string): LegacyEntityMapping | undefined {
    const className = this.byPrismaModel.get(modelName);
    if (className) return this.entityMappings.get(className);
    return undefined;
  }

  /** Get all registered mappings */
  getAll(): LegacyEntityMapping[] {
    return Array.from(this.entityMappings.values());
  }

  /** Get all mapped ontology class names */
  getMappedClasses(): string[] {
    return Array.from(this.entityMappings.keys());
  }

  /** Get all unmapped ontology classes (those needing mapping) */
  getUnmappedClasses(allClasses: string[]): string[] {
    const mapped = new Set(this.getMappedClasses());
    return allClasses.filter((c) => !mapped.has(c));
  }

  /** Remove a mapping */
  remove(ontologyClass: string): void {
    const mapping = this.entityMappings.get(ontologyClass);
    if (mapping) {
      this.byPrismaModel.delete(mapping.prismaModel);
      this.entityMappings.delete(ontologyClass);
    }
  }

  /** Verify a mapping is consistent (field names, types, etc.) */
  verifyConsistency(mapping: LegacyEntityMapping): MappingVerification {
    const issues: MappingIssue[] = [];

    // Check field mappings
    for (const field of mapping.fields) {
      if (!field.prismaField) {
        issues.push({
          type: 'error',
          message: `Field mapping for '${field.ontologyProperty}' has no Prisma field`,
          field: field.ontologyProperty,
        });
      }
    }

    // Check relationship mappings
    for (const rel of mapping.relationships) {
      if (!rel.prismaRelation) {
        issues.push({
          type: 'warning',
          message: `Relationship mapping for '${rel.ontologyProperty}' has no Prisma relation`,
          field: rel.ontologyProperty,
        });
      }
    }

    // Check confidence
    if (mapping.mappingConfidence < 0.5) {
      issues.push({
        type: 'warning',
        message: `Low confidence mapping for '${mapping.ontologyClass}': ${mapping.mappingConfidence}`,
      });
    }

    return {
      ontologyClass: mapping.ontologyClass,
      prismaModel: mapping.prismaModel,
      valid: issues.filter((i) => i.type === 'error').length === 0,
      issues,
      confidence: mapping.mappingConfidence,
    };
  }

  /** Verify all registered mappings */
  verifyAll(): MappingVerification[] {
    return this.getAll().map((m) => this.verifyConsistency(m));
  }

  /** Summarize mapping coverage */
  getCoverage(): MappingCoverage {
    const all = this.getAll();
    const verified = all.filter((m) => m.mappingConfidence >= 0.8);
    const partial = all.filter((m) => m.mappingConfidence >= 0.5 && m.mappingConfidence < 0.8);
    const poor = all.filter((m) => m.mappingConfidence < 0.5);

    const totalFields = all.reduce((s, m) => s + m.fields.length, 0);
    const verifiedFields = all.reduce((s, m) => s + m.fields.filter((f) => f.verified).length, 0);

    return {
      totalMappings: all.length,
      verifiedMappings: verified.length,
      partialMappings: partial.length,
      poorMappings: poor.length,
      totalFields,
      verifiedFields,
      coverage: all.length > 0 ? Math.round((verified.length / all.length) * 100) : 0,
      fieldCoverage: totalFields > 0 ? Math.round((verifiedFields / totalFields) * 100) : 0,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Supporting Types
// ────────────────────────────────────────────────────────────────────────────

export interface MappingVerification {
  ontologyClass: string;
  prismaModel: string;
  valid: boolean;
  issues: MappingIssue[];
  confidence: number;
}

export interface MappingIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export interface MappingCoverage {
  totalMappings: number;
  verifiedMappings: number;
  partialMappings: number;
  poorMappings: number;
  totalFields: number;
  verifiedFields: number;
  coverage: number;       // percentage
  fieldCoverage: number;  // percentage
}

// ────────────────────────────────────────────────────────────────────────────
// Built-in Mappings for iSCARB
// ────────────────────────────────────────────────────────────────────────────

/** Schema-scoped legacy mappings */
export interface LegacyMappingSchema {
  /** Source of these mappings */
  source: string;
  /** When this schema was last updated */
  updatedAt: string;
  /** List of entity mappings */
  mappings: LegacyEntityMapping[];
}

/** Create a basic field mapping */
export function fieldMapping(
  ontologyProperty: string,
  prismaField: string,
  mapping: 'direct' | 'transformed' | 'computed' = 'direct',
  verified = true,
): LegacyFieldMapping {
  return { ontologyProperty, prismaField, mapping, verified };
}

/** Create a basic relationship mapping */
export function relationshipMapping(
  ontologyProperty: string,
  prismaRelation: string,
  cardinalityMatch = true,
): LegacyRelationshipMapping {
  return { ontologyProperty, prismaRelation, cardinalityMatch };
}

/** Create a complete entity mapping */
export function createEntityMapping(
  ontologyClass: string,
  prismaModel: string,
  fields: LegacyFieldMapping[],
  relationships: LegacyRelationshipMapping[],
  confidence = 1.0,
): LegacyEntityMapping {
  return {
    ontologyClass,
    prismaModel,
    fields,
    relationships,
    projectionMode: 'legacy-mapped',
    mappingConfidence: confidence,
  };
}
