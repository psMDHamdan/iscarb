/**
 * TimetableSlot entity mapper — converts Prisma TimetableSlot to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface TimetableSlotEntity {
  id: string;
  timetableId: string;
  timetable: string;
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classroomId?: string | null;
  facultyId?: string | null;
  createdAt: Date;
}

export const timetableSlotMapper: RdfMapper<TimetableSlotEntity> = {
  entityType: "TimetableSlot",
  classUri: classUri("TimetableSlot"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("TimetableSlot", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("TimetableSlot")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:timetableId", entity.timetableId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:timetable", entity.timetable, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dayOfWeek", entity.dayOfWeek, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startTime", entity.startTime, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endTime", entity.endTime, "xsd:string"));
    if (entity.classroomId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:classroomId", entity.classroomId, "xsd:string"));
    }
    if (entity.facultyId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
