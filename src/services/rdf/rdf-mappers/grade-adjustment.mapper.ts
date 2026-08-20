/**
 * GradeAdjustment entity mapper — converts Prisma GradeAdjustment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GradeAdjustmentEntity {
  id: string;
  studentId: string;
  courseId: string;
  facultyId: string;
  oldGrade: number;
  newGrade: number;
  justificationReason: string;
  evidence: string;
  status: string;
  approvedBy?: string | null;
  deanNotified: boolean;
  createdAt: Date;
  reviewedAt?: Date | null;
  universityId?: string | null;
}

export const gradeAdjustmentMapper: RdfMapper<GradeAdjustmentEntity> = {
  entityType: "GradeAdjustment",
  classUri: classUri("GradeAdjustment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("GradeAdjustment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("GradeAdjustment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:oldGrade", entity.oldGrade, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:newGrade", entity.newGrade, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:justificationReason", entity.justificationReason, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:evidence", entity.evidence, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.approvedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:approvedBy", entity.approvedBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:deanNotified", entity.deanNotified, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    if (entity.reviewedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reviewedAt", entity.reviewedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }

    return { triples, graph };
  },
};
