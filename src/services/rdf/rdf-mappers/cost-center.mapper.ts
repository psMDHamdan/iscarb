/**
 * CostCenter entity mapper — converts Prisma CostCenter to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CostCenterEntity {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
  budget?: number | null;
  spent: number;
  parentCode?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const costCenterMapper: RdfMapper<CostCenterEntity> = {
  entityType: "CostCenter",
  classUri: classUri("CostCenter"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CostCenter", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CostCenter")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:code", entity.code, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.budget != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:budget", entity.budget, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:spent", entity.spent, "xsd:decimal"));
    if (entity.parentCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentCode", entity.parentCode, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
