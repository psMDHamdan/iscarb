/**
 * ReportAlert entity mapper — converts Prisma ReportAlert to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportAlertEntity {
  id: string;
  reportId?: string | null;
  name: string;
  description?: string | null;
  condition: string;
  threshold?: number | null;
  metric: string;
  operator: string;
  value?: number | null;
  notifyEmail: boolean;
  notifyDashboard: boolean;
  recipients: string;
  isActive: boolean;
  lastTriggeredAt?: Date | null;
  triggerCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const reportAlertMapper: RdfMapper<ReportAlertEntity> = {
  entityType: "ReportAlert",
  classUri: classUri("ReportAlert"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReportAlert", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReportAlert")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.reportId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reportId", entity.reportId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:condition", entity.condition, "xsd:string"));
    if (entity.threshold != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:threshold", entity.threshold, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:metric", entity.metric, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:operator", entity.operator, "xsd:string"));
    if (entity.value != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:notifyEmail", entity.notifyEmail, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:notifyDashboard", entity.notifyDashboard, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:recipients", entity.recipients, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    if (entity.lastTriggeredAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastTriggeredAt", entity.lastTriggeredAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:triggerCount", entity.triggerCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
