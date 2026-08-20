/**
 * AIStudyRecommendation entity mapper — converts Prisma AIStudyRecommendation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AIStudyRecommendationEntity {
  id: string;
  studentId: string;
  type: string;
  title: string;
  description?: string | null;
  priority: number;
  reasoning?: string | null;
  accepted?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export const aistudyRecommendationMapper: RdfMapper<AIStudyRecommendationEntity> = {
  entityType: "AIStudyRecommendation",
  classUri: classUri("AIStudyRecommendation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AIStudyRecommendation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AIStudyRecommendation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:decimal"));
    if (entity.reasoning != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reasoning", entity.reasoning, "xsd:string"));
    }
    if (entity.accepted != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:accepted", entity.accepted, "xsd:boolean"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
