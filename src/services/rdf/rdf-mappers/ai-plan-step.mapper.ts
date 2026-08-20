/**
 * AiPlanStep entity mapper — converts Prisma AiPlanStep to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiPlanStepEntity {
  id: string;
  planId: string;
  order: number;
  description: string;
  status: string;
  result?: string | null;
  dependencies?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export const aiPlanStepMapper: RdfMapper<AiPlanStepEntity> = {
  entityType: "AiPlanStep",
  classUri: classUri("AiPlanStep"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiPlanStep", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiPlanStep")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:planId", entity.planId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.result != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:result", entity.result, "xsd:string"));
    }
    if (entity.dependencies != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dependencies", entity.dependencies, "xsd:string"));
    }
    if (entity.startedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
