/**
 * ActivityTimeline entity mapper — converts Prisma ActivityTimeline to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ActivityTimelineEntity {
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  category: string;
  severity: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  organizationId?: string | null;
  createdAt: Date;
}

export const activityTimelineMapper: RdfMapper<ActivityTimelineEntity> = {
  entityType: "ActivityTimeline",
  classUri: classUri("ActivityTimeline"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ActivityTimeline", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ActivityTimeline")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.actorId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:actorId", entity.actorId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:action", entity.action, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    if (entity.entityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:severity", entity.severity, "xsd:string"));
    if (entity.details != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:details", entity.details, "xsd:string"));
    }
    if (entity.ipAddress != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ipAddress", entity.ipAddress, "xsd:string"));
    }
    if (entity.userAgent != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userAgent", entity.userAgent, "xsd:string"));
    }
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
