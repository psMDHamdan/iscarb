/**
 * FacultyTimetable entity mapper — converts Prisma FacultyTimetable to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyTimetableEntity {
  id: string;
  facultyId: string;
  courseId?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  building?: string | null;
  semester: string;
  universityId?: string | null;
  createdAt: Date;
}

export const facultyTimetableMapper: RdfMapper<FacultyTimetableEntity> = {
  entityType: "FacultyTimetable",
  classUri: classUri("FacultyTimetable"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyTimetable", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyTimetable")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:dayOfWeek", entity.dayOfWeek, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startTime", entity.startTime, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endTime", entity.endTime, "xsd:string"));
    if (entity.room != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:room", entity.room, "xsd:string"));
    }
    if (entity.building != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:building", entity.building, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:semester", entity.semester, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
