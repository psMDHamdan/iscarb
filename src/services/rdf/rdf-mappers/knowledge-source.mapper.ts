/**
 * KnowledgeSource entity mapper — converts Prisma KnowledgeSource to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeSourceEntity {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  status: string;
  lastSync?: Date | null;
  organizationId?: string | null;
  config?: string | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const knowledgeSourceMapper: RdfMapper<KnowledgeSourceEntity> = {
  entityType: "KnowledgeSource",
  classUri: classUri("KnowledgeSource"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeSource", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeSource")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.lastSync) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastSync", entity.lastSync.toISOString(), "xsd:dateTime"));
    }
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.config != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
