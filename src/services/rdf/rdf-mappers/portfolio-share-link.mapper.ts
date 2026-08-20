/**
 * PortfolioShareLink entity mapper — converts Prisma PortfolioShareLink to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PortfolioShareLinkEntity {
  id: string;
  portfolioId: string;
  token: string;
  expiresAt?: Date | null;
  createdBy: string;
  accessCount: number;
  lastAccessAt?: Date | null;
  createdAt: Date;
}

export const portfolioShareLinkMapper: RdfMapper<PortfolioShareLinkEntity> = {
  entityType: "PortfolioShareLink",
  classUri: classUri("PortfolioShareLink"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PortfolioShareLink", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PortfolioShareLink")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:portfolioId", entity.portfolioId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:token", entity.token, "xsd:string"));
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:accessCount", entity.accessCount, "xsd:decimal"));
    if (entity.lastAccessAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastAccessAt", entity.lastAccessAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
