/**
 * StudySession entity mapper — converts Prisma StudySession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudySessionEntity {
  id: string;
  studentId: string;
  courseId?: string | null;
  type: string;
  title: string;
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: Date;
  completedAt?: Date | null;
  status: string;
  notes?: string | null;
  focusScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const studySessionMapper: RdfMapper<StudySessionEntity> = {
  entityType: "StudySession",
  classUri: classUri("StudySession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudySession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudySession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:plannedMinutes", entity.plannedMinutes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:actualMinutes", entity.actualMinutes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    if (entity.focusScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:focusScore", entity.focusScore, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
