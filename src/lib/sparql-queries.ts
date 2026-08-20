/**
 * iSCARB SPARQL Queries — IDD-07 Database & RDF Ontology
 * ===========================================================================
 * Canonical SPARQL queries for identity platform knowledge graph.
 * ===========================================================================
 */
import { sanitiseSparqlLiteral, sanitiseSparqlIri } from "./sparql-sanitiser";

export const SPARQL_NS = {
  iscarb: 'https://iscarb.edu/ontology/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  schema: 'http://schema.org/',
  prov: 'http://www.w3.org/ns/prov#',
};

/**
 * Get all users in an organization.
 */
export function usersInOrganization(orgId: string): string {
  const safeOrgId = sanitiseSparqlIri(orgId);
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    PREFIX rdfs: <${SPARQL_NS.rdfs}>

    SELECT ?user ?userName ?email
    WHERE {
      ?user rdf:type iscarb:User ;
            rdfs:label ?userName ;
            iscarb:memberOf <${SPARQL_NS.iscarb}Organization:${safeOrgId}> .
      OPTIONAL { ?user <http://xmlns.com/foaf/0.1/mbox> ?email }
    }
  `;
}

/**
 * Get all permissions for a role.
 */
export function permissionsForRole(roleId: string): string {
  const safeRoleId = sanitiseSparqlIri(roleId);
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    PREFIX rdfs: <${SPARQL_NS.rdfs}>

    SELECT ?permission ?permName ?resource ?action
    WHERE {
      <${SPARQL_NS.iscarb}Role:${safeRoleId}> iscarb:grantsPermission ?permission .
      ?permission rdf:type iscarb:Permission ;
                  iscarb:permissionName ?permName ;
                  iscarb:permissionResource ?resource ;
                  iscarb:permissionAction ?action .
    }
  `;
}

/**
 * Check if a user has a specific permission.
 */
export function userHasPermission(userId: string, permission: string): string {
  const safeUserId = sanitiseSparqlIri(userId);
  const safePermission = sanitiseSparqlLiteral(permission);
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>

    ASK
    WHERE {
      <${SPARQL_NS.iscarb}User:${safeUserId}> iscarb:hasUserRole ?role .
      ?role iscarb:grantsPermission ?perm .
      ?perm iscarb:permissionName "${safePermission}" .
    }
  `;
}

/**
 * Get organization hierarchy.
 */
export function orgHierarchy(): string {
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    PREFIX rdfs: <${SPARQL_NS.rdfs}>
    
    SELECT ?org ?orgName ?parent ?parentName ?orgType
    WHERE {
      ?org rdf:type iscarb:Organization ;
           rdfs:label ?orgName ;
           iscarb:orgType ?orgType .
      OPTIONAL {
        ?org iscarb:hasParent ?parent .
        ?parent rdfs:label ?parentName .
      }
    }
    ORDER BY ?parentName ?orgName
  `;
}

/**
 * Get all users with MFA enabled.
 */
export function usersWithMfa(): string {
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    PREFIX rdfs: <${SPARQL_NS.rdfs}>
    
    SELECT ?user ?userName ?mfaMethod
    WHERE {
      ?user rdf:type iscarb:User ;
            rdfs:label ?userName ;
            iscarb:hasMfa ?mfa .
      ?mfa iscarb:mfaEnabled true ;
           iscarb:mfaMethod ?mfaMethod .
    }
  `;
}

/**
 * Get users without MFA (security risk).
 */
export function usersWithoutMfa(): string {
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    PREFIX rdfs: <${SPARQL_NS.rdfs}>
    
    SELECT ?user ?userName
    WHERE {
      ?user rdf:type iscarb:User ;
            rdfs:label ?userName .
      FILTER NOT EXISTS {
        ?user iscarb:hasMfa ?mfa .
        ?mfa iscarb:mfaEnabled true .
      }
    }
  `;
}

/**
 * Get MFA adoption by organization.
 */
export function mfaAdoptionByOrg(): string {
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    
    SELECT ?org (COUNT(?user) AS ?userCount)
    WHERE {
      ?user iscarb:memberOf ?org .
      ?user iscarb:hasMfa ?mfa .
      ?mfa iscarb:mfaEnabled true .
    }
    GROUP BY ?org
  `;
}

/**
 * Get all audit events for an entity.
 */
export function entityAuditTrail(entityId: string): string {
  const safeEntityId = sanitiseSparqlIri(entityId);
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    PREFIX prov: <${SPARQL_NS.prov}>

    SELECT ?event ?action ?category ?timestamp
    WHERE {
      ?event rdf:type iscarb:AuditLog ;
             iscarb:auditAction ?action ;
             iscarb:auditCategory ?category ;
             prov:generatedAt ?timestamp .
      ?event iscarb:auditEntity <${SPARQL_NS.iscarb}Entity:${safeEntityId}> .
    }
    ORDER BY DESC(?timestamp)
    LIMIT 100
  `;
}

/**
 * Get all roles in an organization.
 */
export function rolesInOrganization(orgId: string): string {
  const safeOrgId = sanitiseSparqlIri(orgId);
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    PREFIX rdfs: <${SPARQL_NS.rdfs}>

    SELECT ?role ?roleName ?permissionCount
    WHERE {
      ?role rdf:type iscarb:Role ;
            rdfs:label ?roleName ;
            iscarb:memberOf <${SPARQL_NS.iscarb}Organization:${safeOrgId}> .
      {
        SELECT ?role (COUNT(?perm) AS ?permissionCount)
        WHERE {
          ?role iscarb:grantsPermission ?perm .
        }
        GROUP BY ?role
      }
    }
    ORDER BY DESC(?permissionCount)
  `;
}

/**
 * Get users with a specific role.
 */
export function usersWithRole(roleName: string): string {
  const safeRoleName = sanitiseSparqlLiteral(roleName);
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    PREFIX rdfs: <${SPARQL_NS.rdfs}>

    SELECT ?user ?userName ?orgName
    WHERE {
      ?user rdf:type iscarb:User ;
            rdfs:label ?userName ;
            iscarb:hasUserRole ?role .
      ?role rdfs:label "${safeRoleName}" .
      OPTIONAL {
        ?user iscarb:memberOf ?org .
        ?org rdfs:label ?orgName .
      }
    }
  `;
}

/**
 * Get permission usage statistics.
 */
export function permissionUsageStats(): string {
  return `
    PREFIX iscarb: <${SPARQL_NS.iscarb}>
    PREFIX rdf: <${SPARQL_NS.rdf}>
    
    SELECT ?permission ?permName (COUNT(?role) AS ?roleCount)
    WHERE {
      ?role iscarb:grantsPermission ?permission .
      ?permission iscarb:permissionName ?permName .
    }
    GROUP BY ?permission ?permName
    ORDER BY DESC(?roleCount)
  `;
}

/**
 * Export all SPARQL queries.
 */
export const SPARQL_QUERIES = {
  usersInOrganization,
  permissionsForRole,
  userHasPermission,
  orgHierarchy,
  usersWithMfa,
  usersWithoutMfa,
  mfaAdoptionByOrg,
  entityAuditTrail,
  rolesInOrganization,
  usersWithRole,
  permissionUsageStats,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Knowledge Graph SPARQL execution (Apache Fuseki)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute a SPARQL SELECT query against the configured Fuseki endpoint and
 * transform the results into a {nodes, edges} graph structure for D3 rendering.
 *
 * Environment variables:
 *   FUSEKI_ENDPOINT  — base URL of the Fuseki server (default: http://localhost:3030)
 *   FUSEKI_DATASET   — dataset name (default: iscarb)
 */
export async function executeKnowledgeGraphQuery(
  studentId: string
): Promise<{ nodes: Array<{ id: string; label: string; type: string }>; edges: Array<{ source: string; target: string; label: string }> }> {
  const endpoint = process.env.FUSEKI_ENDPOINT ?? "http://localhost:3030";
  const dataset = process.env.FUSEKI_DATASET ?? "iscarb";
  const url = `${endpoint}/${dataset}/query`;

  const safeStudentId = sanitiseSparqlLiteral(studentId);

  const sparql = `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?subject ?predLabel ?object ?objLabel
    WHERE {
      ?subject ?pred ?object .
      OPTIONAL { rdfs:label ?predLabel }
      OPTIONAL { ?object rdfs:label ?objLabel }
      FILTER(CONTAINS(STR(?subject), "${safeStudentId}") || CONTAINS(STR(?object), "${safeStudentId}"))
    }
    LIMIT 200
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
      },
      body: new URLSearchParams({ query: sparql }),
    });

    if (!res.ok) {
      throw new Error(`Fuseki query failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const bindings: Array<Record<string, { value: string }>> = json?.results?.bindings ?? [];

    // Build nodes + edges from triple bindings
    const nodeMap = new Map<string, { id: string; label: string; type: string }>();
    const edges: Array<{ source: string; target: string; label: string }> = [];

    for (const b of bindings) {
      const s = b.subject?.value ?? "";
      const o = b.object?.value ?? "";
      const p = b.predLabel?.value ?? b.pred?.value ?? "related";
      const oLabel = b.objLabel?.value ?? o.split(/[/#]/).pop() ?? o;

      if (s) nodeMap.set(s, { id: s, label: s.split(/[/#]/).pop() ?? s, type: "entity" });
      if (o) nodeMap.set(o, { id: o, label: oLabel, type: "entity" });
      if (s && o) edges.push({ source: s, target: o, label: p });
    }

    return { nodes: Array.from(nodeMap.values()), edges };
  } catch {
    // Fuseki unavailable — return empty graph (graceful degradation)
    return { nodes: [], edges: [] };
  }
}

/**
 * Execute a student-scoped SPARQL query for the Personal Knowledge Graph.
 * Filters triples to only those associated with the given studentId, built
 * from notes, bookmarks, and learning activity stored in the ontology.
 */
export async function executePersonalGraphQuery(
  studentId: string
): Promise<{ nodes: Array<{ id: string; label: string; type: string }>; edges: Array<{ source: string; target: string; label: string }> }> {
  const endpoint = process.env.FUSEKI_ENDPOINT ?? "http://localhost:3030";
  const dataset = process.env.FUSEKI_DATASET ?? "iscarb";
  const url = `${endpoint}/${dataset}/query`;

  const safeStudentId = sanitiseSparqlLiteral(studentId);

  const sparql = `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?subject ?subjectLabel ?pred ?predLabel ?object ?objectLabel
    WHERE {
      ?student iSCARB:studentId "${safeStudentId}" .
      { ?student ?pred ?object . BIND(?student AS ?subject) }
      UNION
      { ?subject iSCARB:createdBy ?student . ?subject ?pred ?object }
      OPTIONAL { ?subject rdfs:label ?subjectLabel }
      OPTIONAL { ?pred rdfs:label ?predLabel }
      OPTIONAL { ?object rdfs:label ?objectLabel }
    }
    LIMIT 300
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
      },
      body: new URLSearchParams({ query: sparql }),
    });

    if (!res.ok) {
      throw new Error(`Fuseki personal graph query failed: ${res.status}`);
    }

    const json = await res.json();
    const bindings: Array<Record<string, { value: string }>> = json?.results?.bindings ?? [];

    const nodeMap = new Map<string, { id: string; label: string; type: string }>();
    const edges: Array<{ source: string; target: string; label: string }> = [];

    for (const b of bindings) {
      const s = b.subject?.value ?? "";
      const o = b.object?.value ?? "";
      const p = b.predLabel?.value ?? b.pred?.value ?? "related";
      const sLabel = b.subjectLabel?.value ?? s.split(/[/#]/).pop() ?? s;
      const oLabel = b.objectLabel?.value ?? o.split(/[/#]/).pop() ?? o;

      if (s) nodeMap.set(s, { id: s, label: sLabel, type: "personal" });
      if (o) nodeMap.set(o, { id: o, label: oLabel, type: "personal" });
      if (s && o) edges.push({ source: s, target: o, label: p });
    }

    return { nodes: Array.from(nodeMap.values()), edges };
  } catch {
    return { nodes: [], edges: [] };
  }
}
