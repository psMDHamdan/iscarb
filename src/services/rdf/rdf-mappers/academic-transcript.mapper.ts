/**
 * AcademicTranscript entity mapper — converts Prisma AcademicTranscript to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AcademicTranscriptEntity {
  id: string;
  studentId: string;
  programId?: string | null;
  semesterId?: string | null;
  totalCredits: number;
  gpa: number;
  issuedDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const academicTranscriptMapper: RdfMapper<AcademicTranscriptEntity> = {
  entityType: "AcademicTranscript",
  classUri: classUri("AcademicTranscript"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AcademicTranscript", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AcademicTranscript")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.programId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    }
    if (entity.semesterId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:semesterId", entity.semesterId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:totalCredits", entity.totalCredits, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:gpa", entity.gpa, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:issuedDate", entity.issuedDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
