/**
 * AILearningInsight entity mapper — converts Prisma AILearningInsight to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AILearningInsightEntity {
  id: string;
  studentId: string;
  insightType: string;
  title: string;
  description?: string | null;
  confidence: number;
  actionable: boolean;
  acknowledged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ailearningInsightMapper: RdfMapper<AILearningInsightEntity> = {
  entityType: "AILearningInsight",
  classUri: classUri("AILearningInsight"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AILearningInsight", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AILearningInsight")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:insightType", entity.insightType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:confidence", entity.confidence, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:actionable", entity.actionable, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:acknowledged", entity.acknowledged, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
