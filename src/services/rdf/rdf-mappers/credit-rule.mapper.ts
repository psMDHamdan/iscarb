/**
 * CreditRule entity mapper — converts Prisma CreditRule to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CreditRuleEntity {
  id: string;
  programId: string;
  minCredits: number;
  maxCredits: number;
  gpaRequirement?: number | null;
  description?: string | null;
  createdAt: Date;
}

export const creditRuleMapper: RdfMapper<CreditRuleEntity> = {
  entityType: "CreditRule",
  classUri: classUri("CreditRule"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CreditRule", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CreditRule")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:minCredits", entity.minCredits, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:maxCredits", entity.maxCredits, "xsd:decimal"));
    if (entity.gpaRequirement != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:gpaRequirement", entity.gpaRequirement, "xsd:decimal"));
    }
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
