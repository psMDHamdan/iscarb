/**
 * ReportDimension entity mapper — converts Prisma ReportDimension to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportDimensionEntity {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  type: string;
  dataField: string;
  valueFormat?: string | null;
  parentDimension?: string | null;
  hierarchyLevel?: number | null;
  sortOrder: number;
  isActive: boolean;
  icon?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const reportDimensionMapper: RdfMapper<ReportDimensionEntity> = {
  entityType: "ReportDimension",
  classUri: classUri("ReportDimension"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReportDimension", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReportDimension")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:key", entity.key, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dataField", entity.dataField, "xsd:string"));
    if (entity.valueFormat != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:valueFormat", entity.valueFormat, "xsd:string"));
    }
    if (entity.parentDimension != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentDimension", entity.parentDimension, "xsd:string"));
    }
    if (entity.hierarchyLevel != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hierarchyLevel", entity.hierarchyLevel, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:sortOrder", entity.sortOrder, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    if (entity.icon != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:icon", entity.icon, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
