/**
 * FacultyBriefing entity mapper — converts Prisma FacultyBriefing to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyBriefingEntity {
  id: string;
  facultyId: string;
  date: Date;
  greeting?: string | null;
  summary?: string | null;
  topPriority?: string | null;
  focusArea?: string | null;
  tips?: string | null;
  classesToday: number;
  meetingsToday: number;
  pendingGrades: number;
  studentAlerts: number;
  generatedBy: string;
  createdAt: Date;
}

export const facultyBriefingMapper: RdfMapper<FacultyBriefingEntity> = {
  entityType: "FacultyBriefing",
  classUri: classUri("FacultyBriefing"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyBriefing", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyBriefing")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:date", entity.date.toISOString(), "xsd:dateTime"));
    if (entity.greeting != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:greeting", entity.greeting, "xsd:string"));
    }
    if (entity.summary != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:summary", entity.summary, "xsd:string"));
    }
    if (entity.topPriority != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:topPriority", entity.topPriority, "xsd:string"));
    }
    if (entity.focusArea != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:focusArea", entity.focusArea, "xsd:string"));
    }
    if (entity.tips != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:tips", entity.tips, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:classesToday", entity.classesToday, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:meetingsToday", entity.meetingsToday, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:pendingGrades", entity.pendingGrades, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentAlerts", entity.studentAlerts, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:generatedBy", entity.generatedBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
