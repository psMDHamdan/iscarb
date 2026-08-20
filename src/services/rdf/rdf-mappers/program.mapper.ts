/**
 * Program entity mapper — converts Prisma Program to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ProgramEntity {
  id: string;
  name: string;
  nameAr?: string | null;
  code?: string | null;
  departmentId?: string | null;
  description?: string | null;
  status: string;
  organizationId?: string | null;
  metadata?: string | null;
}

export const programMapper: RdfMapper<ProgramEntity> = {
  entityType: "Program",
  classUri: classUri("Program"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Program", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Program")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.nameAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    }
    if (entity.code != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:code", entity.code, "xsd:string"));
    }
    if (entity.departmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:departmentId", entity.departmentId, "xsd:string"));
    }
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
