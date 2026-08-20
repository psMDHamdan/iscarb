/**
 * FundingApplication entity mapper — converts Prisma FundingApplication to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FundingApplicationEntity {
  id: string;
  studentId: string;
  fundingId: string;
  funding: string;
  status: string;
  appliedAt?: Date | null;
  reviewedAt?: Date | null;
  decisionAt?: Date | null;
}

export const fundingApplicationMapper: RdfMapper<FundingApplicationEntity> = {
  entityType: "FundingApplication",
  classUri: classUri("FundingApplication"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FundingApplication", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FundingApplication")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:fundingId", entity.fundingId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:funding", entity.funding, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.appliedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:appliedAt", entity.appliedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.reviewedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reviewedAt", entity.reviewedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.decisionAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:decisionAt", entity.decisionAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
