/**
 * GrantOpportunity entity mapper — converts Prisma GrantOpportunity to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GrantOpportunityEntity {
  id: string;
  title: string;
  provider: string;
  description?: string | null;
  amount?: number | null;
  currency: string;
  deadline?: Date | null;
  eligibility?: string | null;
  category?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const grantOpportunityMapper: RdfMapper<GrantOpportunityEntity> = {
  entityType: "GrantOpportunity",
  classUri: classUri("GrantOpportunity"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("GrantOpportunity", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("GrantOpportunity")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:provider", entity.provider, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.amount != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:amount", entity.amount, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:currency", entity.currency, "xsd:string"));
    if (entity.deadline) {
      triples.push(rdfLiteralTriple(uri, "iscarb:deadline", entity.deadline.toISOString(), "xsd:dateTime"));
    }
    if (entity.eligibility != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:eligibility", entity.eligibility, "xsd:string"));
    }
    if (entity.category != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
