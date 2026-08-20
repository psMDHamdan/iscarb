/**
 * AcademicStanding entity mapper — converts Prisma AcademicStanding to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AcademicStandingEntity {
  id: string;
  studentId: string;
  semesterId: string;
  gpa: number;
  cgpa: number;
  standing: string;
  status: string;
  createdAt: Date;
}

export const academicStandingMapper: RdfMapper<AcademicStandingEntity> = {
  entityType: "AcademicStanding",
  classUri: classUri("AcademicStanding"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AcademicStanding", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AcademicStanding")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:semesterId", entity.semesterId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:gpa", entity.gpa, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:cgpa", entity.cgpa, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:standing", entity.standing, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
