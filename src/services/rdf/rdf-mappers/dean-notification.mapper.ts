/**
 * DeanNotification entity mapper — converts Prisma DeanNotification to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DeanNotificationEntity {
  id: string;
  universityId?: string | null;
  courseId: string;
  courseCode: string;
  adjustmentId?: string | null;
  sectionAdjustments: number;
  sectionEnrolled: number;
  thresholdPct: number;
  message: string;
  severity: string;
  acknowledged: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: Date | null;
  dispatchedAt: Date;
  createdAt: Date;
}

export const deanNotificationMapper: RdfMapper<DeanNotificationEntity> = {
  entityType: "DeanNotification",
  classUri: classUri("DeanNotification"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DeanNotification", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DeanNotification")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseCode", entity.courseCode, "xsd:string"));
    if (entity.adjustmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:adjustmentId", entity.adjustmentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:sectionAdjustments", entity.sectionAdjustments, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sectionEnrolled", entity.sectionEnrolled, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:thresholdPct", entity.thresholdPct, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:message", entity.message, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:severity", entity.severity, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:acknowledged", entity.acknowledged, "xsd:boolean"));
    if (entity.acknowledgedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:acknowledgedBy", entity.acknowledgedBy, "xsd:string"));
    }
    if (entity.acknowledgedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:acknowledgedAt", entity.acknowledgedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:dispatchedAt", entity.dispatchedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
