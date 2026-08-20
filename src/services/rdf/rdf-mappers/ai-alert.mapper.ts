/**
 * AiAlert entity mapper — converts Prisma AiAlert to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiAlertEntity {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  metadata?: string | null;
  createdAt: Date;
  acknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
}

export const aiAlertMapper: RdfMapper<AiAlertEntity> = {
  entityType: "AiAlert",
  classUri: classUri("AiAlert"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiAlert", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiAlert")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:severity", entity.severity, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:message", entity.message, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    if (entity.acknowledgedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:acknowledgedAt", entity.acknowledgedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.resolvedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:resolvedAt", entity.resolvedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
