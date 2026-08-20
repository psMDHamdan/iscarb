/**
 * ReportSchedule entity mapper — converts Prisma ReportSchedule to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportScheduleEntity {
  id: string;
  reportId: string;
  frequency: string;
  cronExpression?: string | null;
  timezone: string;
  autoGenerate: boolean;
  autoEmail: boolean;
  emailRecipients?: string | null;
  retentionDays?: number | null;
  maxVersions?: number | null;
  isActive: boolean;
  nextRunAt?: Date | null;
  lastRunAt?: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const reportScheduleMapper: RdfMapper<ReportScheduleEntity> = {
  entityType: "ReportSchedule",
  classUri: classUri("ReportSchedule"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReportSchedule", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReportSchedule")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:reportId", entity.reportId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:frequency", entity.frequency, "xsd:string"));
    if (entity.cronExpression != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:cronExpression", entity.cronExpression, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:timezone", entity.timezone, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:autoGenerate", entity.autoGenerate, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:autoEmail", entity.autoEmail, "xsd:boolean"));
    if (entity.emailRecipients != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:emailRecipients", entity.emailRecipients, "xsd:string"));
    }
    if (entity.retentionDays != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:retentionDays", entity.retentionDays, "xsd:decimal"));
    }
    if (entity.maxVersions != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:maxVersions", entity.maxVersions, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    if (entity.nextRunAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextRunAt", entity.nextRunAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.lastRunAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastRunAt", entity.lastRunAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
