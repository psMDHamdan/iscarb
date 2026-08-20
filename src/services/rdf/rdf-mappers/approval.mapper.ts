/**
 * Approval entity mapper — converts Prisma Approval to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ApprovalEntity {
  id: string;
  organizationId: string;
  type: string;
  title: string;
  description?: string | null;
  requesterId: string;
  approverIds?: string | null;
  status: string;
  decision?: string | null;
  decisionComment?: string | null;
  decidedAt?: Date | null;
  expiresAt?: Date | null;
  data?: string | null;
  metadata?: string | null;
}

export const approvalMapper: RdfMapper<ApprovalEntity> = {
  entityType: "Approval",
  classUri: classUri("Approval"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Approval", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Approval")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:requesterId", entity.requesterId, "xsd:string"));
    if (entity.approverIds != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:approverIds", entity.approverIds, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.decision != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:decision", entity.decision, "xsd:string"));
    }
    if (entity.decisionComment != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:decisionComment", entity.decisionComment, "xsd:string"));
    }
    if (entity.decidedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:decidedAt", entity.decidedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.data != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:data", entity.data, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
