/**
 * KnowledgeAutomationRule entity mapper — converts Prisma KnowledgeAutomationRule to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeAutomationRuleEntity {
  id: string;
  name: string;
  description?: string | null;
  trigger: string;
  action: string;
  config?: string | null;
  isActive: boolean;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const knowledgeAutomationRuleMapper: RdfMapper<KnowledgeAutomationRuleEntity> = {
  entityType: "KnowledgeAutomationRule",
  classUri: classUri("KnowledgeAutomationRule"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeAutomationRule", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeAutomationRule")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:trigger", entity.trigger, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:action", entity.action, "xsd:string"));
    if (entity.config != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
