/**
 * ResearchOutcome entity mapper — converts Prisma ResearchOutcome to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchOutcomeEntity {
  id: string;
  title: string;
  type: string;
  doi?: string | null;
  abstract?: string | null;
  publishedAt?: Date | null;
  citations: number;
  journal?: string | null;
  authors: string;
  url?: string | null;
  createdAt: Date;
}

export const researchOutcomeMapper: RdfMapper<ResearchOutcomeEntity> = {
  entityType: "ResearchOutcome",
  classUri: classUri("ResearchOutcome"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchOutcome", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchOutcome")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.doi != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:doi", entity.doi, "xsd:string"));
    }
    if (entity.abstract != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:abstract", entity.abstract, "xsd:string"));
    }
    if (entity.publishedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:publishedAt", entity.publishedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:citations", entity.citations, "xsd:decimal"));
    if (entity.journal != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:journal", entity.journal, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:authors", entity.authors, "xsd:string"));
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
