/**
 * Shared utilities for builders.
 */

/**
 * Simple non-cryptographic content hash for checksum comparisons.
 * Deterministic, fast, and consistent across runs.
 */
export function contentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Convert PascalCase or camelCase to snake_case.
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}

/**
 * Create a traceability link with properly typed fields.
 */
export function traceLink(
  sourceType: 'ontology-class' | 'ontology-property' | 'ontology-relationship',
  sourceId: string,
  targetType: 'database-table' | 'database-column' | 'database-constraint' | 'api-endpoint' | 'api-schema' | 'ui-view',
  targetId: string,
  relation: 'derives' | 'implements' | 'satisfies' | 'tests' | 'documents' | 'deploys' | 'monitors',
  confidence = 1.0,
) {
  return {
    id: `trace_${sourceId}_${targetId}`,
    sourceType,
    sourceId,
    targetType,
    targetId,
    relation,
    confidence,
    createdAt: new Date().toISOString(),
  };
}
