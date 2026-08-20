/**
 * AuditLog entity mapper — converts Prisma AuditLog to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AuditLogEntity {
  id: string;
  actorId?: string | null;
  actor?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  category: string;
  severity: string;
  organizationId?: string | null;
  requestId?: string | null;
  at: Date;
}

export const auditLogMapper: RdfMapper<AuditLogEntity> = {
  entityType: "AuditLog",
  classUri: classUri("AuditLog"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AuditLog", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AuditLog")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.actorId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:actorId", entity.actorId, "xsd:string"));
    }
    if (entity.actor != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:actor", entity.actor, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:action", entity.action, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    if (entity.entityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    }
    if (entity.beforeJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:beforeJson", entity.beforeJson, "xsd:string"));
    }
    if (entity.afterJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:afterJson", entity.afterJson, "xsd:string"));
    }
    if (entity.ipAddress != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ipAddress", entity.ipAddress, "xsd:string"));
    }
    if (entity.userAgent != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userAgent", entity.userAgent, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:severity", entity.severity, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.requestId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:requestId", entity.requestId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:at", entity.at.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
