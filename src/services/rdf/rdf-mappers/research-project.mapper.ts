/**
 * ResearchProject entity mapper — converts Prisma ResearchProject to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchProjectEntity {
  id: string;
  title: string;
  description?: string | null;
  principalInvestigatorId: string;
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  budget: number;
  fundingSource?: string | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const researchProjectMapper: RdfMapper<ResearchProjectEntity> = {
  entityType: "ResearchProject",
  classUri: classUri("ResearchProject"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchProject", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchProject")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:principalInvestigatorId", entity.principalInvestigatorId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.startDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:budget", entity.budget, "xsd:decimal"));
    if (entity.fundingSource != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:fundingSource", entity.fundingSource, "xsd:string"));
    }
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
