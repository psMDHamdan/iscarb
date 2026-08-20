/**
 * NotificationPreference entity mapper — converts Prisma NotificationPreference to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface NotificationPreferenceEntity {
  id: string;
  userId: string;
  userType: string;
  messageNotifications: boolean;
  announcementNotifications: boolean;
  calendarReminders: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  quietHours?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const notificationPreferenceMapper: RdfMapper<NotificationPreferenceEntity> = {
  entityType: "NotificationPreference",
  classUri: classUri("NotificationPreference"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("NotificationPreference", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("NotificationPreference")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userType", entity.userType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:messageNotifications", entity.messageNotifications, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:announcementNotifications", entity.announcementNotifications, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:calendarReminders", entity.calendarReminders, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:emailNotifications", entity.emailNotifications, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:pushNotifications", entity.pushNotifications, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:smsNotifications", entity.smsNotifications, "xsd:boolean"));
    if (entity.quietHours != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:quietHours", entity.quietHours, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
