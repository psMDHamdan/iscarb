/**
 * ReportExecution entity mapper — converts Prisma ReportExecution to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportExecutionEntity {
  id: string;
  reportId: string;
  executedBy: string;
  executedAt: Date;
  completedAt?: Date | null;
  status: string;
  durationMs?: number | null;
  rowsProcessed?: number | null;
  rowsReturned?: number | null;
  error?: string | null;
  errorStack?: string | null;
  outputPath?: string | null;
  outputFormat: string;
  outputSize?: number | null;
  runtimeFilters?: string | null;
  runtimeMetrics?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const reportExecutionMapper: RdfMapper<ReportExecutionEntity> = {
  entityType: "ReportExecution",
  classUri: classUri("ReportExecution"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReportExecution", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReportExecution")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:reportId", entity.reportId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:executedBy", entity.executedBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:executedAt", entity.executedAt.toISOString(), "xsd:dateTime"));
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.durationMs != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:durationMs", entity.durationMs, "xsd:decimal"));
    }
    if (entity.rowsProcessed != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rowsProcessed", entity.rowsProcessed, "xsd:decimal"));
    }
    if (entity.rowsReturned != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rowsReturned", entity.rowsReturned, "xsd:decimal"));
    }
    if (entity.error != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:error", entity.error, "xsd:string"));
    }
    if (entity.errorStack != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:errorStack", entity.errorStack, "xsd:string"));
    }
    if (entity.outputPath != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:outputPath", entity.outputPath, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:outputFormat", entity.outputFormat, "xsd:string"));
    if (entity.outputSize != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:outputSize", entity.outputSize, "xsd:decimal"));
    }
    if (entity.runtimeFilters != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:runtimeFilters", entity.runtimeFilters, "xsd:string"));
    }
    if (entity.runtimeMetrics != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:runtimeMetrics", entity.runtimeMetrics, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
