/**
 * PortfolioCareerProfile entity mapper — converts Prisma PortfolioCareerProfile to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PortfolioCareerProfileEntity {
  id: string;
  portfolioId: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  yearsExperience: number;
  openToRemote: boolean;
  visaSponsorship: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const portfolioCareerProfileMapper: RdfMapper<PortfolioCareerProfileEntity> = {
  entityType: "PortfolioCareerProfile",
  classUri: classUri("PortfolioCareerProfile"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PortfolioCareerProfile", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PortfolioCareerProfile")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:portfolioId", entity.portfolioId, "xsd:string"));
    if (entity.salaryMin != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryMin", entity.salaryMin, "xsd:decimal"));
    }
    if (entity.salaryMax != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryMax", entity.salaryMax, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:yearsExperience", entity.yearsExperience, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:openToRemote", entity.openToRemote, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:visaSponsorship", entity.visaSponsorship, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
