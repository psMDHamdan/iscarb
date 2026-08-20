/**
 * Booking entity mapper — converts Prisma Booking to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface BookingEntity {
  id: string;
  roomId: string;
  room: string;
  userId: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  purpose?: string | null;
  status: string;
  recurring?: string | null;
  recurringEnd?: Date | null;
  metadata?: string | null;
}

export const bookingMapper: RdfMapper<BookingEntity> = {
  entityType: "Booking",
  classUri: classUri("Booking"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Booking", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Booking")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:roomId", entity.roomId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:room", entity.room, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:startTime", entity.startTime.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endTime", entity.endTime.toISOString(), "xsd:dateTime"));
    if (entity.purpose != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:purpose", entity.purpose, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.recurring != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recurring", entity.recurring, "xsd:string"));
    }
    if (entity.recurringEnd) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recurringEnd", entity.recurringEnd.toISOString(), "xsd:dateTime"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
