/**
 * NetworkingEvent entity mapper — converts Prisma NetworkingEvent to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface NetworkingEventEntity {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  eventType: string;
  date: Date;
  location?: string | null;
  organizer?: string | null;
  attended: boolean;
  notes?: string | null;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const networkingEventMapper: RdfMapper<NetworkingEventEntity> = {
  entityType: "NetworkingEvent",
  classUri: classUri("NetworkingEvent"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("NetworkingEvent", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("NetworkingEvent")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:eventType", entity.eventType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:date", entity.date.toISOString(), "xsd:dateTime"));
    if (entity.location != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    }
    if (entity.organizer != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizer", entity.organizer, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:attended", entity.attended, "xsd:boolean"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
