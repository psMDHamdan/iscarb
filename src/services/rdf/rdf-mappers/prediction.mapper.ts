/**
 * Prediction entity mapper — converts Prisma Prediction to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PredictionEntity {
  id: string;
  entityType: string;
  entityId: string;
  predictionType: string;
  score: number;
  confidence: number;
  model: string;
  validUntil: Date;
  createdAt: Date;
}

export const predictionMapper: RdfMapper<PredictionEntity> = {
  entityType: "Prediction",
  classUri: classUri("Prediction"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Prediction", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Prediction")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:predictionType", entity.predictionType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:confidence", entity.confidence, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:validUntil", entity.validUntil.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
