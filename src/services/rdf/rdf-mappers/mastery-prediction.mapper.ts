/**
 * MasteryPrediction entity mapper — converts Prisma MasteryPrediction to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MasteryPredictionEntity {
  id: string;
  studentId: string;
  courseId?: string | null;
  concept: string;
  predictedMastery: number;
  confidence: number;
  predictedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const masteryPredictionMapper: RdfMapper<MasteryPredictionEntity> = {
  entityType: "MasteryPrediction",
  classUri: classUri("MasteryPrediction"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("MasteryPrediction", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("MasteryPrediction")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:concept", entity.concept, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:predictedMastery", entity.predictedMastery, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:confidence", entity.confidence, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:predictedAt", entity.predictedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
