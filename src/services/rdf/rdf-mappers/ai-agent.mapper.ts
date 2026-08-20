/**
 * AiAgent entity mapper — converts Prisma AiAgent to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiAgentEntity {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  config?: string | null;
  tools?: string | null;
  systemPrompt?: string | null;
  status: string;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const aiAgentMapper: RdfMapper<AiAgentEntity> = {
  entityType: "AiAgent",
  classUri: classUri("AiAgent"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiAgent", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiAgent")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.config != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));
    }
    if (entity.tools != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:tools", entity.tools, "xsd:string"));
    }
    if (entity.systemPrompt != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:systemPrompt", entity.systemPrompt, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
