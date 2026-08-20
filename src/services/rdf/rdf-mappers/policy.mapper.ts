/**
 * Policy entity mapper — converts Prisma Policy to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PolicyEntity {
  id: string;
  organizationId: string;
  title: string;
  content?: string | null;
  category: string;
  status: string;
  effectiveDate?: Date | null;
  expiryDate?: Date | null;
  version: number;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  metadata?: string | null;
}

export const policyMapper: RdfMapper<PolicyEntity> = {
  entityType: "Policy",
  classUri: classUri("Policy"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Policy", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Policy")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.effectiveDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:effectiveDate", entity.effectiveDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.expiryDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiryDate", entity.expiryDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
    if (entity.approvedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:approvedBy", entity.approvedBy, "xsd:string"));
    }
    if (entity.approvedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:approvedAt", entity.approvedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
