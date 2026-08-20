/**
 * ActivityFeed entity mapper — converts Prisma ActivityFeed to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ActivityFeedEntity {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  metadata?: string | null;
  organizationId?: string | null;
  createdAt: Date;
}

export const activityFeedMapper: RdfMapper<ActivityFeedEntity> = {
  entityType: "ActivityFeed",
  classUri: classUri("ActivityFeed"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ActivityFeed", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ActivityFeed")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:action", entity.action, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    if (entity.entityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    }
    if (entity.entityName != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityName", entity.entityName, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
