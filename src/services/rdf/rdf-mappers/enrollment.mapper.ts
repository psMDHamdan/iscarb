/**
 * Enrollment entity mapper — converts Prisma Enrollment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface EnrollmentEntity {
  id: string;
  courseId: string;
  studentId?: string | null;
  facultyId?: string | null;
  semester?: string;
  enrolledAt?: Date;
  universityId?: string | null;
}

export const enrollmentMapper: RdfMapper<EnrollmentEntity> = {
  entityType: "Enrollment",
  classUri: classUri("Enrollment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Enrollment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Enrollment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfTriple(uri, "iscarb:enrolledInCourse", instanceUri("Course", universityCode, entity.courseId)),
    ];

    if (entity.studentId) {
      triples.push(rdfTriple(uri, "iscarb:enrolledByStudent", instanceUri("Student", universityCode, entity.studentId)));
    }
    if (entity.facultyId) {
      triples.push(rdfTriple(uri, "iscarb:taughtByFaculty", instanceUri("Faculty", universityCode, entity.facultyId)));
    }
    if (entity.semester) {
      triples.push(rdfLiteralTriple(uri, "iscarb:inSemester", entity.semester, "xsd:string"));
    }
    if (entity.enrolledAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:enrolledAt", entity.enrolledAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
