/**
 * CourseRegistration entity mapper — converts Prisma CourseRegistration to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CourseRegistrationEntity {
  id: string;
  studentId: string;
  courseId: string;
  semesterId: string;
  status: string;
  registeredAt: Date;
  droppedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const courseRegistrationMapper: RdfMapper<CourseRegistrationEntity> = {
  entityType: "CourseRegistration",
  classUri: classUri("CourseRegistration"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CourseRegistration", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CourseRegistration")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:semesterId", entity.semesterId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:registeredAt", entity.registeredAt.toISOString(), "xsd:dateTime"));
    if (entity.droppedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:droppedAt", entity.droppedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
