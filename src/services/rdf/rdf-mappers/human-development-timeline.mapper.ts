/**
 * HumanDevelopmentTimeline entity mapper — converts Prisma HumanDevelopmentTimeline to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface HumanDevelopmentTimelineEntity {
  id: string;
  userId: string;
  eventType: string;
  eventName: string;
  eventDescription?: string | null;
  category: string;
  metadata?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  points: number;
  createdAt: Date;
}

export const humanDevelopmentTimelineMapper: RdfMapper<HumanDevelopmentTimelineEntity> = {
  entityType: "HumanDevelopmentTimeline",
  classUri: classUri("HumanDevelopmentTimeline"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("HumanDevelopmentTimeline", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("HumanDevelopmentTimeline")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:eventType", entity.eventType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:eventName", entity.eventName, "xsd:string"));
    if (entity.eventDescription != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:eventDescription", entity.eventDescription, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    if (entity.entityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    }
    if (entity.entityType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:points", entity.points, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
