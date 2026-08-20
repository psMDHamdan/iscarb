/**
 * AiMetric entity mapper — converts Prisma AiMetric to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiMetricEntity {
  id: string;
  metric: string;
  value: number;
  dimensions?: string | null;
  timestamp: Date;
}

export const aiMetricMapper: RdfMapper<AiMetricEntity> = {
  entityType: "AiMetric",
  classUri: classUri("AiMetric"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiMetric", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiMetric")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:metric", entity.metric, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:decimal"));
    if (entity.dimensions != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dimensions", entity.dimensions, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:timestamp", entity.timestamp.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
