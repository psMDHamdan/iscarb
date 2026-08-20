/**
 * PortfolioReview entity mapper — converts Prisma PortfolioReview to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PortfolioReviewEntity {
  id: string;
  studentId: string;
  overallScore: number;
  marketComparison: string;
  model?: string | null;
  createdAt: Date;
}

export const portfolioReviewMapper: RdfMapper<PortfolioReviewEntity> = {
  entityType: "PortfolioReview",
  classUri: classUri("PortfolioReview"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PortfolioReview", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PortfolioReview")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:overallScore", entity.overallScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:marketComparison", entity.marketComparison, "xsd:string"));
    if (entity.model != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
