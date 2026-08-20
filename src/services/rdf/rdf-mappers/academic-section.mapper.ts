/**
 * AcademicSection entity mapper — converts Prisma AcademicSection to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AcademicSectionEntity {
  id: string;
  programId: string;
  name: string;
  capacity: number;
  batch?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const academicSectionMapper: RdfMapper<AcademicSectionEntity> = {
  entityType: "AcademicSection",
  classUri: classUri("AcademicSection"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AcademicSection", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AcademicSection")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:capacity", entity.capacity, "xsd:decimal"));
    if (entity.batch != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:batch", entity.batch, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
