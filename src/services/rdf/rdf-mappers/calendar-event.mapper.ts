/**
 * CalendarEvent entity mapper — converts Prisma CalendarEvent to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CalendarEventEntity {
  id: string;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  location?: string | null;
  eventType: string;
  startTime: Date;
  endTime: Date;
  recurrence?: string | null;
  recurrenceEnd?: Date | null;
  organizerId: string;
  capacity?: number | null;
  registered: number;
  roomNumber?: string | null;
  buildingCode?: string | null;
  onlineUrl?: string | null;
  meetingId?: string | null;
  status: string;
  visibility: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const calendarEventMapper: RdfMapper<CalendarEventEntity> = {
  entityType: "CalendarEvent",
  classUri: classUri("CalendarEvent"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CalendarEvent", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CalendarEvent")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.titleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    }
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.descriptionAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:descriptionAr", entity.descriptionAr, "xsd:string"));
    }
    if (entity.location != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:eventType", entity.eventType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startTime", entity.startTime.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endTime", entity.endTime.toISOString(), "xsd:dateTime"));
    if (entity.recurrence != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recurrence", entity.recurrence, "xsd:string"));
    }
    if (entity.recurrenceEnd) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recurrenceEnd", entity.recurrenceEnd.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:organizerId", entity.organizerId, "xsd:string"));
    if (entity.capacity != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:capacity", entity.capacity, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:registered", entity.registered, "xsd:decimal"));
    if (entity.roomNumber != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:roomNumber", entity.roomNumber, "xsd:string"));
    }
    if (entity.buildingCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:buildingCode", entity.buildingCode, "xsd:string"));
    }
    if (entity.onlineUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:onlineUrl", entity.onlineUrl, "xsd:string"));
    }
    if (entity.meetingId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:meetingId", entity.meetingId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:visibility", entity.visibility, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
