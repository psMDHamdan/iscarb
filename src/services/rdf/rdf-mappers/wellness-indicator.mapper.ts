/**
 * WellnessIndicator entity mapper — converts Prisma WellnessIndicator to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WellnessIndicatorEntity {
  id: string;
  userId: string;
  indicatorType: string;
  value: number;
  notes?: string | null;
  recordedAt: Date;
  metadata?: string | null;
}

export const wellnessIndicatorMapper: RdfMapper<WellnessIndicatorEntity> = {
  entityType: "WellnessIndicator",
  classUri: classUri("WellnessIndicator"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WellnessIndicator", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WellnessIndicator")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:indicatorType", entity.indicatorType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:decimal"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:recordedAt", entity.recordedAt.toISOString(), "xsd:dateTime"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
