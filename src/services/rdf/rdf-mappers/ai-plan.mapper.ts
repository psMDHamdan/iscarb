/**
 * AiPlan entity mapper — converts Prisma AiPlan to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiPlanEntity {
  id: string;
  userId: string;
  goal: string;
  description?: string | null;
  status: string;
  priority: number;
  targetDate?: Date | null;
  completedAt?: Date | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const aiPlanMapper: RdfMapper<AiPlanEntity> = {
  entityType: "AiPlan",
  classUri: classUri("AiPlan"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiPlan", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiPlan")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:goal", entity.goal, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:decimal"));
    if (entity.targetDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetDate", entity.targetDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
