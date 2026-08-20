/**
 * ReportTemplate entity mapper — converts Prisma ReportTemplate to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportTemplateEntity {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  config: string;
  metrics: string;
  dimensions?: string | null;
  filters?: string | null;
  icon?: string | null;
  thumbnail?: string | null;
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const reportTemplateMapper: RdfMapper<ReportTemplateEntity> = {
  entityType: "ReportTemplate",
  classUri: classUri("ReportTemplate"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReportTemplate", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReportTemplate")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metrics", entity.metrics, "xsd:string"));
    if (entity.dimensions != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dimensions", entity.dimensions, "xsd:string"));
    }
    if (entity.filters != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:filters", entity.filters, "xsd:string"));
    }
    if (entity.icon != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:icon", entity.icon, "xsd:string"));
    }
    if (entity.thumbnail != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:thumbnail", entity.thumbnail, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublic", entity.isPublic, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:usageCount", entity.usageCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
