/**
 * PortfolioView entity mapper — converts Prisma PortfolioView to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PortfolioViewEntity {
  id: string;
  portfolioId: string;
  viewerId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  viewedAt: Date;
}

export const portfolioViewMapper: RdfMapper<PortfolioViewEntity> = {
  entityType: "PortfolioView",
  classUri: classUri("PortfolioView"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PortfolioView", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PortfolioView")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:portfolioId", entity.portfolioId, "xsd:string"));
    if (entity.viewerId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:viewerId", entity.viewerId, "xsd:string"));
    }
    if (entity.ipHash != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ipHash", entity.ipHash, "xsd:string"));
    }
    if (entity.userAgent != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userAgent", entity.userAgent, "xsd:string"));
    }
    if (entity.referer != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:referer", entity.referer, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:viewedAt", entity.viewedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
