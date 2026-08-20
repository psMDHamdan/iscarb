/**
 * CalibrationSession entity mapper — converts Prisma CalibrationSession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CalibrationSessionEntity {
  id: string;
  assessmentId: string;
  universityId: string;
  title: string;
  description?: string | null;
  facilitated?: string | null;
  createdAt: Date;
}

export const calibrationSessionMapper: RdfMapper<CalibrationSessionEntity> = {
  entityType: "CalibrationSession",
  classUri: classUri("CalibrationSession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CalibrationSession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CalibrationSession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:assessmentId", entity.assessmentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.facilitated != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:facilitated", entity.facilitated, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
