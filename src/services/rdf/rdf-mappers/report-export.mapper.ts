/**
 * ReportExport entity mapper — converts Prisma ReportExport to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportExportEntity {
  id: string;
  reportId: string;
  format: string;
  compression?: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  downloadUrl?: string | null;
  filters?: string | null;
  includedColumns?: string | null;
  exportedBy: string;
  exportedAt: Date;
  expiresAt?: Date | null;
  downloadCount: number;
  lastDownloadAt?: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const reportExportMapper: RdfMapper<ReportExportEntity> = {
  entityType: "ReportExport",
  classUri: classUri("ReportExport"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReportExport", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReportExport")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:reportId", entity.reportId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    if (entity.compression != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:compression", entity.compression, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:fileName", entity.fileName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:mimeType", entity.mimeType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:fileSize", entity.fileSize, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:filePath", entity.filePath, "xsd:string"));
    if (entity.downloadUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:downloadUrl", entity.downloadUrl, "xsd:string"));
    }
    if (entity.filters != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:filters", entity.filters, "xsd:string"));
    }
    if (entity.includedColumns != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:includedColumns", entity.includedColumns, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:exportedBy", entity.exportedBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:exportedAt", entity.exportedAt.toISOString(), "xsd:dateTime"));
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:downloadCount", entity.downloadCount, "xsd:decimal"));
    if (entity.lastDownloadAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastDownloadAt", entity.lastDownloadAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.ipAddress != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ipAddress", entity.ipAddress, "xsd:string"));
    }
    if (entity.userAgent != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userAgent", entity.userAgent, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
