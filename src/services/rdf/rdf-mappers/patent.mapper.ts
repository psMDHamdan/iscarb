/**
 * Patent entity mapper — converts Prisma Patent to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PatentEntity {
  id: string;
  title: string;
  abstract?: string | null;
  inventors?: string | null;
  filingDate?: Date | null;
  grantDate?: Date | null;
  patentNumber?: string | null;
  status: string;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const patentMapper: RdfMapper<PatentEntity> = {
  entityType: "Patent",
  classUri: classUri("Patent"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Patent", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Patent")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.abstract != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:abstract", entity.abstract, "xsd:string"));
    }
    if (entity.inventors != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:inventors", entity.inventors, "xsd:string"));
    }
    if (entity.filingDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:filingDate", entity.filingDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.grantDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:grantDate", entity.grantDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.patentNumber != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:patentNumber", entity.patentNumber, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.category != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
