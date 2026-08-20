/**
 * AIRecommendation entity mapper — converts Prisma AIRecommendation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AIRecommendationEntity {
  id: string;
  studentId: string;
  type: string;
  title: string;
  description?: string | null;
  reasoning: string;
  relatedEntity?: string | null;
  relatedType?: string | null;
  status: string;
  acceptedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export const airecommendationMapper: RdfMapper<AIRecommendationEntity> = {
  entityType: "AIRecommendation",
  classUri: classUri("AIRecommendation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AIRecommendation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AIRecommendation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:reasoning", entity.reasoning, "xsd:string"));
    if (entity.relatedEntity != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:relatedEntity", entity.relatedEntity, "xsd:string"));
    }
    if (entity.relatedType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:relatedType", entity.relatedType, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.acceptedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:acceptedAt", entity.acceptedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
