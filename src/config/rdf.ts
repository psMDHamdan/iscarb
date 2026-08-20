/**
 * RDF Knowledge Graph configuration.
 * Centralizes all RDF/Triple Store settings.
 */
export const rdfConfig = {
  fuseki: {
    url: process.env.FUSEKI_URL || "http://localhost:3030/iscarb",
    adminUrl: process.env.FUSEKI_ADMIN_URL || "http://localhost:3030",
    timeout: parseInt(process.env.FUSEKI_TIMEOUT_MS || "30000"),
    maxRetries: parseInt(process.env.FUSEKI_MAX_RETRIES || "3"),
    retryDelay: parseInt(process.env.FUSEKI_RETRY_DELAY_MS || "1000"),
    /** Only true when FUSEKI_URL is explicitly set in the environment. */
    enabled: !!process.env.FUSEKI_URL,
  },
  namespaces: {
    iscarb: "https://iscarb.edu/ontology/",
    iscarbInst: "https://iscarb.edu/instance/",
    iscarbNs: "https://iscarb.edu/ns/",
  },
  sync: {
    batchSize: 100,
    maxConcurrentSyncs: 4,
    syncStateTtlDays: 90,
  },
  graph: {
    maxTraversalDepth: 5,
    maxResults: 1000,
    enableInference: true,
  },
} as const;

/** Generate a named graph URI for a university */
export function universityGraph(universityCode: string): string {
  return `urn:iscarb:university:${universityCode}`;
}

/** Generate an instance URI for an entity */
export function instanceUri(
  entityType: string,
  universityCode: string,
  entityId: string,
): string {
  return `https://iscarb.edu/instance/${entityType}/${universityCode}/${entityId}`;
}

/** Generate a class URI */
export function classUri(className: string): string {
  return `https://iscarb.edu/ontology/${className}`;
}

/** System named graph (ontology + reference data) */
export const SYSTEM_GRAPH = "urn:iscarb:system";
