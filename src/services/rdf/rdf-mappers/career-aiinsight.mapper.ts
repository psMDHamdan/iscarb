/**
 * CareerAIInsight entity mapper — converts Prisma CareerAIInsight to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerAIInsightEntity {
  id: string;
  studentId: string;
  insightType: string;
  title: string;
  description?: string | null;
  confidenceScore?: number | null;
  actionable: boolean;
  dismissed: boolean;
  generatedAt: Date;
  universityId?: string | null;
}

export const careerAiinsightMapper: RdfMapper<CareerAIInsightEntity> = {
  entityType: "CareerAIInsight",
  classUri: classUri("CareerAIInsight"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerAIInsight", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerAIInsight")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:insightType", entity.insightType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.confidenceScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:confidenceScore", entity.confidenceScore, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:actionable", entity.actionable, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dismissed", entity.dismissed, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:generatedAt", entity.generatedAt.toISOString(), "xsd:dateTime"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }

    return { triples, graph };
  },
};
