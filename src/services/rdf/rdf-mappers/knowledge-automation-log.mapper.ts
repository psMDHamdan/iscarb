/**
 * KnowledgeAutomationLog entity mapper — converts Prisma KnowledgeAutomationLog to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeAutomationLogEntity {
  id: string;
  ruleId: string;
  rule: string;
  entityType?: string | null;
  entityId?: string | null;
  status: string;
  input?: string | null;
  output?: string | null;
  error?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export const knowledgeAutomationLogMapper: RdfMapper<KnowledgeAutomationLogEntity> = {
  entityType: "KnowledgeAutomationLog",
  classUri: classUri("KnowledgeAutomationLog"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeAutomationLog", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeAutomationLog")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:ruleId", entity.ruleId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:rule", entity.rule, "xsd:string"));
    if (entity.entityType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    }
    if (entity.entityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.input != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:input", entity.input, "xsd:string"));
    }
    if (entity.output != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:output", entity.output, "xsd:string"));
    }
    if (entity.error != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:error", entity.error, "xsd:string"));
    }
    if (entity.startedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
