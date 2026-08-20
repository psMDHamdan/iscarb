/**
 * AiToolExecution entity mapper — converts Prisma AiToolExecution to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiToolExecutionEntity {
  id: string;
  toolId: string;
  tool: string;
  sessionId?: string | null;
  userId: string;
  params: string;
  result?: string | null;
  status: string;
  errorMessage?: string | null;
  durationMs: number;
  createdAt: Date;
}

export const aiToolExecutionMapper: RdfMapper<AiToolExecutionEntity> = {
  entityType: "AiToolExecution",
  classUri: classUri("AiToolExecution"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiToolExecution", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiToolExecution")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:toolId", entity.toolId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:tool", entity.tool, "xsd:string"));
    if (entity.sessionId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:params", entity.params, "xsd:string"));
    if (entity.result != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:result", entity.result, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.errorMessage != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:errorMessage", entity.errorMessage, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:durationMs", entity.durationMs, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
