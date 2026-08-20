/**
 * AiAgentMessage entity mapper — converts Prisma AiAgentMessage to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiAgentMessageEntity {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  toolCalls?: string | null;
  toolResults?: string | null;
  tokens: number;
  createdAt: Date;
}

export const aiAgentMessageMapper: RdfMapper<AiAgentMessageEntity> = {
  entityType: "AiAgentMessage",
  classUri: classUri("AiAgentMessage"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiAgentMessage", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiAgentMessage")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.toolCalls != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:toolCalls", entity.toolCalls, "xsd:string"));
    }
    if (entity.toolResults != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:toolResults", entity.toolResults, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:tokens", entity.tokens, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
