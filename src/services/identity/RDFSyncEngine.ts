import { db } from '@/lib/db';

// This would typically come from environment variables
const SPARQL_ENDPOINT = process.env.SPARQL_ENDPOINT || 'http://localhost:3030/iscarb/update';

export class RDFSyncEngine {
  /**
   * Sync a user's role assignment to the RDF Knowledge Graph
   */
  static async syncUserRole(userId: string, roleName: string, organizationId: string) {
    const userUri = `<user:${userId}>`;
    const roleUri = `<role:${roleName}>`;
    const orgUri = `<org:${organizationId}>`;

    // iSCARB Ontology prefixes
    const prefix = `
      PREFIX iscarb: <http://iscarb.io/ontology#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    `;

    const insertQuery = `
      ${prefix}
      INSERT DATA {
        ${userUri} rdf:type iscarb:Person .
        ${userUri} iscarb:hasRole ${roleUri} .
        ${userUri} iscarb:memberOf ${orgUri} .
      }
    `;

    try {
      await this.executeSparqlUpdate(insertQuery);
      
      // Update sync state
      await db.rdfSyncState.upsert({
        where: {
          entityType_entityId_universityCode: {
            entityType: 'UserRole',
            entityId: `${userId}:${roleName}`,
            universityCode: organizationId, // Using organizationId as the scope
          }
        },
        update: {
          lastSyncedAt: new Date(),
          status: 'synced',
        },
        create: {
          entityType: 'UserRole',
          entityId: `${userId}:${roleName}`,
          universityCode: organizationId,
          lastSyncedAt: new Date(),
          status: 'synced',
        }
      });

    } catch (error) {
      console.error('Failed to sync to RDF:', error);
      // In production, we'd queue this for retry or mark as failed in rdfSyncState
    }
  }

  private static async executeSparqlUpdate(query: string) {
    // If the endpoint isn't properly configured or we're in a test env without Fuseki, just mock it.
    if (!process.env.SPARQL_ENDPOINT) {
      console.log('SPARQL_ENDPOINT not set, skipping actual HTTP call. Query:', query);
      return;
    }

    const response = await fetch(SPARQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-update',
      },
      body: query,
    });

    if (!response.ok) {
      throw new Error(`SPARQL update failed: ${response.statusText}`);
    }
  }
}
