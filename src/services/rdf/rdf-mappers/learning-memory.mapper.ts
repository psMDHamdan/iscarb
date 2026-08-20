/**
 * LearningMemory entity mapper — converts Prisma LearningMemory to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LearningMemoryEntity {
  id: string;
  studentId: string;
  topicId?: string | null;
  concept: string;
  masteryLevel: number;
  lastAccessed: Date;
  confidenceScore: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const learningMemoryMapper: RdfMapper<LearningMemoryEntity> = {
  entityType: "LearningMemory",
  classUri: classUri("LearningMemory"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LearningMemory", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LearningMemory")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.topicId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:topicId", entity.topicId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:concept", entity.concept, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:masteryLevel", entity.masteryLevel, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:lastAccessed", entity.lastAccessed.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:confidenceScore", entity.confidenceScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:reviewCount", entity.reviewCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
