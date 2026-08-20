/**
 * AiModel entity mapper — converts Prisma AiModel to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiModelEntity {
  id: string;
  name: string;
  version: string;
  provider: string;
  endpoint?: string | null;
  apiKeyEncrypted?: string | null;
  config?: string | null;
  status: string;
  health: string;
  maxTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  createdAt: Date;
  updatedAt: Date;
}

export const aiModelMapper: RdfMapper<AiModelEntity> = {
  entityType: "AiModel",
  classUri: classUri("AiModel"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiModel", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiModel")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:provider", entity.provider, "xsd:string"));
    if (entity.endpoint != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endpoint", entity.endpoint, "xsd:string"));
    }
    if (entity.apiKeyEncrypted != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:apiKeyEncrypted", entity.apiKeyEncrypted, "xsd:string"));
    }
    if (entity.config != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:health", entity.health, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:maxTokens", entity.maxTokens, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:costPer1kInput", entity.costPer1kInput, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:costPer1kOutput", entity.costPer1kOutput, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
