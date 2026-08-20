/**
 * ExaminationSchedule entity mapper — converts Prisma ExaminationSchedule to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ExaminationScheduleEntity {
  id: string;
  semesterId: string;
  courseId: string;
  type: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  venue?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const examinationScheduleMapper: RdfMapper<ExaminationScheduleEntity> = {
  entityType: "ExaminationSchedule",
  classUri: classUri("ExaminationSchedule"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ExaminationSchedule", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ExaminationSchedule")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:semesterId", entity.semesterId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:date", entity.date.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startTime", entity.startTime, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endTime", entity.endTime, "xsd:string"));
    if (entity.venue != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:venue", entity.venue, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
