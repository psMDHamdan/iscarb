/**
 * AiEvaluation entity mapper — converts Prisma AiEvaluation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiEvaluationEntity {
  id: string;
  sessionId?: string | null;
  userId: string;
  metric: string;
  value: number;
  threshold?: number | null;
  passed: boolean;
  details?: string | null;
  createdAt: Date;
}

export const aiEvaluationMapper: RdfMapper<AiEvaluationEntity> = {
  entityType: "AiEvaluation",
  classUri: classUri("AiEvaluation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiEvaluation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiEvaluation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.sessionId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metric", entity.metric, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:decimal"));
    if (entity.threshold != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:threshold", entity.threshold, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:passed", entity.passed, "xsd:boolean"));
    if (entity.details != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:details", entity.details, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
