/**
 * AiRequestLog entity mapper — converts Prisma AiRequestLog to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiRequestLogEntity {
  id: string;
  model?: string | null;
  userId: string;
  modelId?: string | null;
  prompt: string;
  response?: string | null;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  latencyMs: number;
  status: string;
  errorMessage?: string | null;
  metadata?: string | null;
  createdAt: Date;
}

export const aiRequestLogMapper: RdfMapper<AiRequestLogEntity> = {
  entityType: "AiRequestLog",
  classUri: classUri("AiRequestLog"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiRequestLog", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiRequestLog")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.model != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    if (entity.modelId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:modelId", entity.modelId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:prompt", entity.prompt, "xsd:string"));
    if (entity.response != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:response", entity.response, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:tokensInput", entity.tokensInput, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:tokensOutput", entity.tokensOutput, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:cost", entity.cost, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:latencyMs", entity.latencyMs, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.errorMessage != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:errorMessage", entity.errorMessage, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
