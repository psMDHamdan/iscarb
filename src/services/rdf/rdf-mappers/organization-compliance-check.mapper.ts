/**
 * OrganizationComplianceCheck entity mapper — converts Prisma OrganizationComplianceCheck to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OrganizationComplianceCheckEntity {
  id: string;
  organizationId: string;
  regulation: string;
  title: string;
  description?: string | null;
  status: string;
  lastChecked?: Date | null;
  nextCheck?: Date | null;
  checkedBy?: string | null;
  evidence?: string | null;
  metadata?: string | null;
}

export const organizationComplianceCheckMapper: RdfMapper<OrganizationComplianceCheckEntity> = {
  entityType: "OrganizationComplianceCheck",
  classUri: classUri("OrganizationComplianceCheck"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OrganizationComplianceCheck", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OrganizationComplianceCheck")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:regulation", entity.regulation, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.lastChecked) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastChecked", entity.lastChecked.toISOString(), "xsd:dateTime"));
    }
    if (entity.nextCheck) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextCheck", entity.nextCheck.toISOString(), "xsd:dateTime"));
    }
    if (entity.checkedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:checkedBy", entity.checkedBy, "xsd:string"));
    }
    if (entity.evidence != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:evidence", entity.evidence, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
