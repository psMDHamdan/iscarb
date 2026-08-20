/**
 * Notification entity mapper — converts Prisma Notification to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface NotificationEntity {
  id: string;
  studentId: string;
  type: string;
  titleEn: string;
  titleAr: string;
  bodyEn?: string | null;
  bodyAr?: string | null;
  metaJson: string;
}

export const notificationMapper: RdfMapper<NotificationEntity> = {
  entityType: "Notification",
  classUri: classUri("Notification"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Notification", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Notification")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleEn", entity.titleEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    if (entity.bodyEn != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bodyEn", entity.bodyEn, "xsd:string"));
    }
    if (entity.bodyAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bodyAr", entity.bodyAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:metaJson", entity.metaJson, "xsd:string"));

    return { triples, graph };
  },
};
