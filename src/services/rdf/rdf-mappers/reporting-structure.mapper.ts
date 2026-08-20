/**
 * ReportingStructure entity mapper — converts Prisma ReportingStructure to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReportingStructureEntity {
  id: string;
  userId: string;
  managerId: string;
  departmentId?: string | null;
  reportsTo?: string | null;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  metadata?: string | null;
}

export const reportingStructureMapper: RdfMapper<ReportingStructureEntity> = {
  entityType: "ReportingStructure",
  classUri: classUri("ReportingStructure"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReportingStructure", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReportingStructure")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:managerId", entity.managerId, "xsd:string"));
    if (entity.departmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:departmentId", entity.departmentId, "xsd:string"));
    }
    if (entity.reportsTo != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reportsTo", entity.reportsTo, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:effectiveFrom", entity.effectiveFrom.toISOString(), "xsd:dateTime"));
    if (entity.effectiveTo) {
      triples.push(rdfLiteralTriple(uri, "iscarb:effectiveTo", entity.effectiveTo.toISOString(), "xsd:dateTime"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
