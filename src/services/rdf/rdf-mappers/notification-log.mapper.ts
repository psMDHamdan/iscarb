/**
 * NotificationLog entity mapper — converts Prisma NotificationLog to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface NotificationLogEntity {
  id: string;
  userId: string;
  userType: string;
  type: string;
  channel: string;
  subject?: string | null;
  body: string;
  status: string;
  sourceId?: string | null;
  errorMessage?: string | null;
  metadata: string;
}

export const notificationLogMapper: RdfMapper<NotificationLogEntity> = {
  entityType: "NotificationLog",
  classUri: classUri("NotificationLog"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("NotificationLog", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("NotificationLog")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userType", entity.userType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:channel", entity.channel, "xsd:string"));
    if (entity.subject != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:subject", entity.subject, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:body", entity.body, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.sourceId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sourceId", entity.sourceId, "xsd:string"));
    }
    if (entity.errorMessage != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:errorMessage", entity.errorMessage, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));

    return { triples, graph };
  },
};
