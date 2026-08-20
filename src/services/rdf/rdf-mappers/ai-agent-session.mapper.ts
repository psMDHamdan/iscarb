/**
 * AiAgentSession entity mapper — converts Prisma AiAgentSession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiAgentSessionEntity {
  id: string;
  agentId: string;
  userId: string;
  context?: string | null;
  status: string;
  startedAt: Date;
  endedAt?: Date | null;
}

export const aiAgentSessionMapper: RdfMapper<AiAgentSessionEntity> = {
  entityType: "AiAgentSession",
  classUri: classUri("AiAgentSession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiAgentSession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiAgentSession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:agentId", entity.agentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    if (entity.context != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:context", entity.context, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    if (entity.endedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endedAt", entity.endedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
