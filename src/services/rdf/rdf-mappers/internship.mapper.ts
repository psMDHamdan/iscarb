/**
 * Internship entity mapper — converts Prisma Internship to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface InternshipEntity {
  id: string;
  studentId: string;
  employer: string;
  role: string;
  startDate: Date;
  endDate?: Date | null;
  supervisorName?: string | null;
  supervisorEmail?: string | null;
  evaluationScore?: number | null;
  evaluationNotes?: string | null;
  status: string;
  projectId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const internshipMapper: RdfMapper<InternshipEntity> = {
  entityType: "Internship",
  classUri: classUri("Internship"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Internship", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Internship")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:employer", entity.employer, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.supervisorName != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:supervisorName", entity.supervisorName, "xsd:string"));
    }
    if (entity.supervisorEmail != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:supervisorEmail", entity.supervisorEmail, "xsd:string"));
    }
    if (entity.evaluationScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:evaluationScore", entity.evaluationScore, "xsd:decimal"));
    }
    if (entity.evaluationNotes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:evaluationNotes", entity.evaluationNotes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.projectId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
