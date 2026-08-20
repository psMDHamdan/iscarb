/**
 * Semester entity mapper — converts Prisma Semester to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SemesterEntity {
  id: string;
  academicYearId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const semesterMapper: RdfMapper<SemesterEntity> = {
  entityType: "Semester",
  classUri: classUri("Semester"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Semester", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Semester")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasName", entity.name, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasStartDate", entity.startDate.toISOString(), "xsd:dateTime"),
      rdfLiteralTriple(uri, "iscarb:hasEndDate", entity.endDate.toISOString(), "xsd:dateTime"),
    ];

    if (entity.academicYearId) {
      triples.push(rdfTriple(uri, "iscarb:belongsAcademicYear", instanceUri("AcademicYear", universityCode, entity.academicYearId)));
    }
    if (entity.status) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasStatus", entity.status, "xsd:string"));
    }
    if (entity.createdAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.updatedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
