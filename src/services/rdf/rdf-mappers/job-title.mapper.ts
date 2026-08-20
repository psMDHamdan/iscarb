/**
 * JobTitle entity mapper — converts Prisma JobTitle to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JobTitleEntity {
  id: string;
  organizationId: string;
  title: string;
  level: number;
  description?: string | null;
  category?: string | null;
  salaryRangeMin?: number | null;
  salaryRangeMax?: number | null;
  status: string;
  metadata?: string | null;
}

export const jobTitleMapper: RdfMapper<JobTitleEntity> = {
  entityType: "JobTitle",
  classUri: classUri("JobTitle"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JobTitle", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JobTitle")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:level", entity.level, "xsd:decimal"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.category != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    }
    if (entity.salaryRangeMin != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryRangeMin", entity.salaryRangeMin, "xsd:decimal"));
    }
    if (entity.salaryRangeMax != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryRangeMax", entity.salaryRangeMax, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
