/**
 * CalibrationScoreAdjustment entity mapper — converts Prisma CalibrationScoreAdjustment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CalibrationScoreAdjustmentEntity {
  id: string;
  sessionId: string;
  submissionId: string;
  criterionId: string;
  oldScore: number;
  newScore: number;
  rationale?: string | null;
  reviewedAt: Date;
}

export const calibrationScoreAdjustmentMapper: RdfMapper<CalibrationScoreAdjustmentEntity> = {
  entityType: "CalibrationScoreAdjustment",
  classUri: classUri("CalibrationScoreAdjustment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CalibrationScoreAdjustment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CalibrationScoreAdjustment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:submissionId", entity.submissionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:criterionId", entity.criterionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:oldScore", entity.oldScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:newScore", entity.newScore, "xsd:decimal"));
    if (entity.rationale != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rationale", entity.rationale, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:reviewedAt", entity.reviewedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
