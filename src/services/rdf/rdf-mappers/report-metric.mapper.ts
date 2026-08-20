/**
 * ReportMetric entity mapper — converts Prisma ReportMetric to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportMetricEntity {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category: string;
  dataSource: string;
  aggregationType: string;
  sortOrder: number;
  isActive: boolean;
  formula?: string | null;
  format?: string | null;
  precision?: number | null;
  color?: string | null;
  icon?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const reportMetricMapper: RdfMapper<ReportMetricEntity> = {
  entityType: "ReportMetric",
  classUri: classUri("ReportMetric"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReportMetric", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReportMetric")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:key", entity.key, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dataSource", entity.dataSource, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:aggregationType", entity.aggregationType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sortOrder", entity.sortOrder, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    if (entity.formula != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:formula", entity.formula, "xsd:string"));
    }
    if (entity.format != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    }
    if (entity.precision != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:precision", entity.precision, "xsd:decimal"));
    }
    if (entity.color != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:color", entity.color, "xsd:string"));
    }
    if (entity.icon != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:icon", entity.icon, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
