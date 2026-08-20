/**
 * AiModelVersion entity mapper — converts Prisma AiModelVersion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiModelVersionEntity {
  id: string;
  modelId: string;
  model: string;
  version: string;
  config?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export const aiModelVersionMapper: RdfMapper<AiModelVersionEntity> = {
  entityType: "AiModelVersion",
  classUri: classUri("AiModelVersion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiModelVersion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiModelVersion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:modelId", entity.modelId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:string"));
    if (entity.config != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
