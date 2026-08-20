/**
 * EmailLog entity mapper — converts Prisma EmailLog to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface EmailLogEntity {
  id: string;
  templateId?: string | null;
  to: string;
  subject: string;
  status: string;
  sentAt: Date;
  deliveredAt?: Date | null;
  errorMessage?: string | null;
  metadata?: string | null;
}

export const emailLogMapper: RdfMapper<EmailLogEntity> = {
  entityType: "EmailLog",
  classUri: classUri("EmailLog"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("EmailLog", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("EmailLog")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.templateId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:templateId", entity.templateId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:to", entity.to, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:subject", entity.subject, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sentAt", entity.sentAt.toISOString(), "xsd:dateTime"));
    if (entity.deliveredAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:deliveredAt", entity.deliveredAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.errorMessage != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:errorMessage", entity.errorMessage, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
