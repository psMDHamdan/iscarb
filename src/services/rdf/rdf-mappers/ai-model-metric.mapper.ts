/**
 * AiModelMetric entity mapper — converts Prisma AiModelMetric to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiModelMetricEntity {
  id: string;
  modelId: string;
  model: string;
  metric: string;
  value: number;
  timestamp: Date;
}

export const aiModelMetricMapper: RdfMapper<AiModelMetricEntity> = {
  entityType: "AiModelMetric",
  classUri: classUri("AiModelMetric"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiModelMetric", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiModelMetric")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:modelId", entity.modelId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metric", entity.metric, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:timestamp", entity.timestamp.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
