/**
 * PortfolioAchievement entity mapper — converts Prisma PortfolioAchievement to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PortfolioAchievementEntity {
  id: string;
  portfolioId: string;
  title: string;
  description?: string | null;
  type: string;
  issuer?: string | null;
  issuedDate?: Date | null;
  expiryDate?: Date | null;
  credentialUrl?: string | null;
  badgeUrl?: string | null;
  verified: boolean;
  createdAt: Date;
}

export const portfolioAchievementMapper: RdfMapper<PortfolioAchievementEntity> = {
  entityType: "PortfolioAchievement",
  classUri: classUri("PortfolioAchievement"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PortfolioAchievement", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PortfolioAchievement")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:portfolioId", entity.portfolioId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.issuer != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:issuer", entity.issuer, "xsd:string"));
    }
    if (entity.issuedDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:issuedDate", entity.issuedDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.expiryDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiryDate", entity.expiryDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.credentialUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:credentialUrl", entity.credentialUrl, "xsd:string"));
    }
    if (entity.badgeUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:badgeUrl", entity.badgeUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:verified", entity.verified, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
