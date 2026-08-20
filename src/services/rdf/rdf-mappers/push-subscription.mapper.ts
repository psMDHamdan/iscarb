/**
 * PushSubscription entity mapper — converts Prisma PushSubscription to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PushSubscriptionEntity {
  id: string;
  studentId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  emailOptIn: boolean;
  createdAt: Date;
}

export const pushSubscriptionMapper: RdfMapper<PushSubscriptionEntity> = {
  entityType: "PushSubscription",
  classUri: classUri("PushSubscription"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PushSubscription", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PushSubscription")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endpoint", entity.endpoint, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:p256dh", entity.p256dh, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:auth", entity.auth, "xsd:string"));
    if (entity.userAgent != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userAgent", entity.userAgent, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:emailOptIn", entity.emailOptIn, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
