/**
 * Database Verification Rules
 *
 * Verifies that every entity has appropriate database projection artifacts
 * (tables, columns, constraints).
 */
import type { SemanticModelIR } from '../../ir/types';
import type { VerificationFinding } from '../../ir/trace-ir';

export interface DbRuleResult {
  findings: VerificationFinding[];
  score: number;
}

export function runDbRules(ir: SemanticModelIR): DbRuleResult {
  const findings: VerificationFinding[] = [];

  for (const entity of ir.entities) {
    // Generated entities must have table traceability
    if (entity.projectionMode === 'generated-greenfield' || entity.projectionMode === 'generated-authoritative') {
      const hasTableLink = ir.traceability.some(
        (t) => t.sourceId === entity.name && t.targetType === 'database-table',
      );
      if (!hasTableLink) {
        findings.push({
          severity: 'warning',
          category: 'missing-api',
          message: `Generated entity '${entity.name}' is missing a database table`,
          source: `entity:${entity.name}`,
          target: 'database',
        });
      }
    }

    // Check required properties have storage
    for (const propRef of entity.ownedProperties) {
      if (propRef.required) {
        const hasColLink = ir.traceability.some(
          (t) => t.sourceId === propRef.propertyId && t.targetType === 'database-column',
        );
        if (!hasColLink) {
          findings.push({
            severity: 'info',
            category: 'missing-entity',
            message: `Required property '${propRef.name}' on '${entity.name}' missing database column`,
            source: `property:${propRef.propertyId}`,
            target: 'database',
          });
        }
      }
    }
  }

  const errors = findings.filter((f) => f.severity === 'error').length;
  const score = findings.length > 0 ? Math.round(((findings.length - errors) / findings.length) * 100) : 100;

  return { findings, score };
}
