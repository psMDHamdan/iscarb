/**
 * Risk entity mapper — converts Prisma Risk to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface RiskEntity {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  status: string;
  mitigation?: string | null;
  owner?: string | null;
  dueDate?: Date | null;
  metadata?: string | null;
}

export const riskMapper: RdfMapper<RiskEntity> = {
  entityType: "Risk",
  classUri: classUri("Risk"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Risk", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Risk")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:likelihood", entity.likelihood, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:impact", entity.impact, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:riskScore", entity.riskScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.mitigation != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:mitigation", entity.mitigation, "xsd:string"));
    }
    if (entity.owner != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:owner", entity.owner, "xsd:string"));
    }
    if (entity.dueDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dueDate", entity.dueDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
