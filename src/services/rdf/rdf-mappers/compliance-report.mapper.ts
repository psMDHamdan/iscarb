import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ComplianceReportEntity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  organizationId?: string | null;
  generatedBy?: string | null;
  generatedAt?: Date | null;
}

export const complianceReportMapper: RdfMapper<ComplianceReportEntity> = {
  entityType: "ComplianceReport",
  classUri: classUri("ComplianceReport"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ComplianceReport", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ComplianceReport")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"),
    ];

    if (entity.description) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.organizationId) {
      triples.push(rdfTriple(uri, "iscarb:belongsToOrganization", instanceUri("Organization", universityCode, entity.organizationId)));
    }
    if (entity.generatedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:generatedAt", entity.generatedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph, uri };
  },

  fromTriples(triples) {
    return {};
  },
};
