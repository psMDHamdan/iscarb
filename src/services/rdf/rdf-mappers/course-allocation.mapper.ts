/**
 * CourseAllocation entity mapper — converts Prisma CourseAllocation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CourseAllocationEntity {
  id: string;
  courseId: string;
  semesterId: string;
  sectionId?: string | null;
  facultyId?: string | null;
  classroomId?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const courseAllocationMapper: RdfMapper<CourseAllocationEntity> = {
  entityType: "CourseAllocation",
  classUri: classUri("CourseAllocation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CourseAllocation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CourseAllocation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:semesterId", entity.semesterId, "xsd:string"));
    if (entity.sectionId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sectionId", entity.sectionId, "xsd:string"));
    }
    if (entity.facultyId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    }
    if (entity.classroomId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:classroomId", entity.classroomId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
