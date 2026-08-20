/**
 * PortfolioSkill entity mapper — converts Prisma PortfolioSkill to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PortfolioSkillEntity {
  id: string;
  portfolioId: string;
  name: string;
  level: number;
  endorsementCount: number;
  yearsExperience: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const portfolioSkillMapper: RdfMapper<PortfolioSkillEntity> = {
  entityType: "PortfolioSkill",
  classUri: classUri("PortfolioSkill"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PortfolioSkill", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PortfolioSkill")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:portfolioId", entity.portfolioId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:level", entity.level, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endorsementCount", entity.endorsementCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:yearsExperience", entity.yearsExperience, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isVerified", entity.isVerified, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
