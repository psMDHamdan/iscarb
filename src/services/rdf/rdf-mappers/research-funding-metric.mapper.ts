/**
 * ResearchFundingMetric entity mapper — converts Prisma ResearchFundingMetric to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchFundingMetricEntity {
  id: string;
  organizationId: string;
  totalFunding: number;
  activeGrants: number;
  completedGrants: number;
  period: string;
  calculatedAt: Date;
}

export const researchFundingMetricMapper: RdfMapper<ResearchFundingMetricEntity> = {
  entityType: "ResearchFundingMetric",
  classUri: classUri("ResearchFundingMetric"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchFundingMetric", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchFundingMetric")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:totalFunding", entity.totalFunding, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:activeGrants", entity.activeGrants, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:completedGrants", entity.completedGrants, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:period", entity.period, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:calculatedAt", entity.calculatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
