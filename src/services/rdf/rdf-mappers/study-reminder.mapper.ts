/**
 * StudyReminder entity mapper — converts Prisma StudyReminder to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudyReminderEntity {
  id: string;
  studentId: string;
  title: string;
  message?: string | null;
  reminderTime: Date;
  recurring: boolean;
  recurringType?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const studyReminderMapper: RdfMapper<StudyReminderEntity> = {
  entityType: "StudyReminder",
  classUri: classUri("StudyReminder"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudyReminder", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudyReminder")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.message != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:message", entity.message, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:reminderTime", entity.reminderTime.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:recurring", entity.recurring, "xsd:boolean"));
    if (entity.recurringType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recurringType", entity.recurringType, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:active", entity.active, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
