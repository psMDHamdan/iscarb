/**
 * Structural Verification Rules
 *
 * Verifies that the ontology structure is complete and consistent.
 * These are the most fundamental checks — if these fail, everything downstream is broken.
 */
import type { SemanticModelIR } from '../../ir/types';
import type { VerificationFinding } from '../../ir/trace-ir';

export interface StructuralRuleResult {
  findings: VerificationFinding[];
  score: number; // 0-100
}

/**
 * Rule: Every entity must have at least one property
 */
export function checkEntitiesHaveProperties(ir: SemanticModelIR): VerificationFinding[] {
  const findings: VerificationFinding[] = [];

  for (const entity of ir.entities) {
    const totalProps = entity.ownedProperties.length + entity.inheritedProperties.length;
    if (totalProps === 0 && entity.projectionMode !== 'legacy-observed') {
      findings.push({
        severity: 'warning',
        category: 'missing-entity',
        message: `Entity '${entity.name}' has no properties (owned or inherited)`,
        source: `entity:${entity.name}`,
      });
    }
  }

  return findings;
}

/**
 * Rule: Every entity must have at least a name or label property
 */
export function checkEntitiesHaveLabels(ir: SemanticModelIR): VerificationFinding[] {
  const findings: VerificationFinding[] = [];

  for (const entity of ir.entities) {
    if (!entity.label && !entity.name) {
      findings.push({
        severity: 'error',
        category: 'missing-entity',
        message: `Entity '${entity.name}' is missing both name and label`,
        source: `entity:${entity.name}`,
      });
    }
  }

  return findings;
}

/**
 * Rule: Check for circular inheritance
 */
export function checkCircularInheritance(ir: SemanticModelIR): VerificationFinding[] {
  const findings: VerificationFinding[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const hasCycle = (entityName: string): boolean => {
    if (inStack.has(entityName)) return true;
    if (visited.has(entityName)) return false;

    visited.add(entityName);
    inStack.add(entityName);

    const entity = ir.entities.find((e) => e.name === entityName);
    if (entity?.parentClass && hasCycle(entity.parentClass)) {
      inStack.delete(entityName);
      return true;
    }

    inStack.delete(entityName);
    return false;
  };

  for (const entity of ir.entities) {
    visited.clear();
    inStack.clear();
    if (hasCycle(entity.name)) {
      findings.push({
        severity: 'error',
        category: 'inconsistency',
        message: `Circular inheritance detected involving entity '${entity.name}'`,
        source: `entity:${entity.name}`,
      });
    }
  }

  return findings;
}

/**
 * Run all structural rules
 */
export function runStructuralRules(ir: SemanticModelIR): StructuralRuleResult {
  const allFindings: VerificationFinding[] = [
    ...checkEntitiesHaveProperties(ir),
    ...checkEntitiesHaveLabels(ir),
    ...checkCircularInheritance(ir),
  ];

  const errors = allFindings.filter((f) => f.severity === 'error').length;
  const total = allFindings.length;
  const score = total > 0 ? Math.round(((total - errors) / total) * 100) : 100;

  return { findings: allFindings, score };
}
