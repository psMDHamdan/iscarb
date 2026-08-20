/**
 * AcademicProgram entity mapper — converts Prisma AcademicProgram to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AcademicProgramEntity {
  id: string;
  organizationId: string;
  departmentId: string;
  name: string;
  degreeLevel?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const academicProgramMapper: RdfMapper<AcademicProgramEntity> = {
  entityType: "AcademicProgram",
  classUri: classUri("AcademicProgram"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AcademicProgram", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AcademicProgram")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:departmentId", entity.departmentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.degreeLevel != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:degreeLevel", entity.degreeLevel, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
