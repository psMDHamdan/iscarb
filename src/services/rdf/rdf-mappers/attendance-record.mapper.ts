/**
 * AttendanceRecord entity mapper — converts Prisma AttendanceRecord to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AttendanceRecordEntity {
  id: string;
  studentId: string;
  courseId: string;
  sessionDate: Date;
  status: string;
  method: string;
  note?: string | null;
  createdAt: Date;
  universityId?: string | null;
}

export const attendanceRecordMapper: RdfMapper<AttendanceRecordEntity> = {
  entityType: "AttendanceRecord",
  classUri: classUri("AttendanceRecord"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AttendanceRecord", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AttendanceRecord")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sessionDate", entity.sessionDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:method", entity.method, "xsd:string"));
    if (entity.note != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:note", entity.note, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }

    return { triples, graph };
  },
};
