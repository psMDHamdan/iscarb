/**
 * Report entity mapper — converts Prisma Report to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportEntity {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  category: string;
  owner: string;
  ownerType: string;
  universityId?: string | null;
  config: string;
  filters?: string | null;
  metrics: string;
  dimensions?: string | null;
  query?: string | null;
  queryType: string;
  dataSource?: string | null;
  isScheduled: boolean;
  schedulePattern?: string | null;
  nextRunAt?: Date | null;
  lastRunAt?: Date | null;
  outputFormat: string;
  fileSize?: number | null;
  rowCount?: number | null;
  status: string;
  lastError?: string | null;
  executionTimeMs?: number | null;
  version: number;
  isPublic: boolean;
  sharedWith?: string | null;
  tags?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const reportMapper: RdfMapper<ReportEntity> = {
  entityType: "Report",
  classUri: classUri("Report"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Report", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Report")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:owner", entity.owner, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:ownerType", entity.ownerType, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));
    if (entity.filters != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:filters", entity.filters, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:metrics", entity.metrics, "xsd:string"));
    if (entity.dimensions != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dimensions", entity.dimensions, "xsd:string"));
    }
    if (entity.query != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:query", entity.query, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:queryType", entity.queryType, "xsd:string"));
    if (entity.dataSource != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dataSource", entity.dataSource, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isScheduled", entity.isScheduled, "xsd:boolean"));
    if (entity.schedulePattern != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:schedulePattern", entity.schedulePattern, "xsd:string"));
    }
    if (entity.nextRunAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextRunAt", entity.nextRunAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.lastRunAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastRunAt", entity.lastRunAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:outputFormat", entity.outputFormat, "xsd:string"));
    if (entity.fileSize != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:fileSize", entity.fileSize, "xsd:decimal"));
    }
    if (entity.rowCount != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rowCount", entity.rowCount, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.lastError != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastError", entity.lastError, "xsd:string"));
    }
    if (entity.executionTimeMs != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:executionTimeMs", entity.executionTimeMs, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublic", entity.isPublic, "xsd:boolean"));
    if (entity.sharedWith != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sharedWith", entity.sharedWith, "xsd:string"));
    }
    if (entity.tags != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:tags", entity.tags, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    if (entity.deletedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:deletedAt", entity.deletedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
