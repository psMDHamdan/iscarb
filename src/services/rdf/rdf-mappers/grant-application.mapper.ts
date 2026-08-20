/**
 * GrantApplication entity mapper — converts Prisma GrantApplication to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GrantApplicationEntity {
  id: string;
  grantOpportunityId: string;
  grantOpportunity: string;
  projectId: string;
  project: string;
  status: string;
  amount?: number | null;
  submissionDate?: Date | null;
  decisionDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const grantApplicationMapper: RdfMapper<GrantApplicationEntity> = {
  entityType: "GrantApplication",
  classUri: classUri("GrantApplication"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("GrantApplication", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("GrantApplication")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:grantOpportunityId", entity.grantOpportunityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:grantOpportunity", entity.grantOpportunity, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:project", entity.project, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.amount != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:amount", entity.amount, "xsd:decimal"));
    }
    if (entity.submissionDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:submissionDate", entity.submissionDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.decisionDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:decisionDate", entity.decisionDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
