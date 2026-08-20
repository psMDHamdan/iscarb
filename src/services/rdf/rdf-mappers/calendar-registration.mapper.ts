/**
 * CalendarRegistration entity mapper — converts Prisma CalendarRegistration to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CalendarRegistrationEntity {
  id: string;
  eventId: string;
  userId: string;
  userType: string;
  status: string;
  registeredAt: Date;
  attendedAt?: Date | null;
  feedback?: string | null;
  rating?: number | null;
}

export const calendarRegistrationMapper: RdfMapper<CalendarRegistrationEntity> = {
  entityType: "CalendarRegistration",
  classUri: classUri("CalendarRegistration"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CalendarRegistration", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CalendarRegistration")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:eventId", entity.eventId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userType", entity.userType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:registeredAt", entity.registeredAt.toISOString(), "xsd:dateTime"));
    if (entity.attendedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:attendedAt", entity.attendedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.feedback != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:feedback", entity.feedback, "xsd:string"));
    }
    if (entity.rating != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:decimal"));
    }

    return { triples, graph };
  },
};
