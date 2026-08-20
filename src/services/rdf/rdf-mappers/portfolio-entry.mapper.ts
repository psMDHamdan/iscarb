/**
 * PortfolioEntry entity mapper — converts Prisma PortfolioEntry to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PortfolioEntryEntity {
  id: string;
  portfolioId: string;
  title: string;
  description: string;
  category: string;
  content?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const portfolioEntryMapper: RdfMapper<PortfolioEntryEntity> = {
  entityType: "PortfolioEntry",
  classUri: classUri("PortfolioEntry"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PortfolioEntry", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PortfolioEntry")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:portfolioId", entity.portfolioId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    if (entity.imageUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:imageUrl", entity.imageUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublished", entity.isPublished, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
