export interface SparqlBinding {
  type: string;
  value: string;
  datatype?: string;
}

export interface SparqlResult {
  head: { vars: string[] };
  results: { bindings: Record<string, SparqlBinding>[] };
}

/**
 * Knowledge Graph Service Layer
 * Abstracts the underlying triple store (currently Ontop Virtual Graph)
 * to avoid vendor lock-in and provide a unified query/update interface.
 */
export class KnowledgeGraphClient {
  private endpointUrl: string;

  constructor(endpointUrl: string = process.env.SPARQL_ENDPOINT || 'http://127.0.0.1:8080/sparql') {
    this.endpointUrl = endpointUrl;
  }

  /**
   * Executes a SPARQL SELECT/CONSTRUCT query against the knowledge graph.
   */
  async query(sparql: string): Promise<SparqlResult> {
    const res = await fetch(this.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/json'
      },
      body: sparql
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Knowledge Graph Query Failed (${res.status}): ${errText}`);
    }

    return await res.json();
  }

  /**
   * Retrieves an entity by its IRI and constructs a localized subgraph
   */
  async getEntityGraph(iri: string): Promise<SparqlResult> {
    const query = `
      CONSTRUCT { <${iri}> ?p ?o }
      WHERE { <${iri}> ?p ?o }
    `;
    return this.query(query);
  }
}

export const kgClient = new KnowledgeGraphClient();
