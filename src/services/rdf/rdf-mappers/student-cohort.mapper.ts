/**
 * StudentCohort entity mapper — converts Prisma StudentCohort to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentCohortEntity {
  id: string;
  programId: string;
  name: string;
  year: number;
  startDate: Date;
  status: string;
  createdAt: Date;
}

export const studentCohortMapper: RdfMapper<StudentCohortEntity> = {
  entityType: "StudentCohort",
  classUri: classUri("StudentCohort"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentCohort", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentCohort")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:year", entity.year, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
