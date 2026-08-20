/**
 * ResearchAnalytics entity mapper — converts Prisma ResearchAnalytics to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchAnalyticsEntity {
  id: string;
  metric: string;
  value: number;
  timestamp: Date;
  period: string;
}

export const researchAnalyticsMapper: RdfMapper<ResearchAnalyticsEntity> = {
  entityType: "ResearchAnalytics",
  classUri: classUri("ResearchAnalytics"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchAnalytics", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchAnalytics")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:metric", entity.metric, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:timestamp", entity.timestamp.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:period", entity.period, "xsd:string"));

    return { triples, graph };
  },
};
