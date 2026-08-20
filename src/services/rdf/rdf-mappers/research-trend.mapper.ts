/**
 * ResearchTrend entity mapper — converts Prisma ResearchTrend to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchTrendEntity {
  id: string;
  topic: string;
  description?: string | null;
  trendScore: number;
  period: string;
  discoveredAt: Date;
}

export const researchTrendMapper: RdfMapper<ResearchTrendEntity> = {
  entityType: "ResearchTrend",
  classUri: classUri("ResearchTrend"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchTrend", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchTrend")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:topic", entity.topic, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:trendScore", entity.trendScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:period", entity.period, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:discoveredAt", entity.discoveredAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
