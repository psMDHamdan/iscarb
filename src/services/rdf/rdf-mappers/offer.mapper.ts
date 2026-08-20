/**
 * Offer entity mapper — converts Prisma Offer to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OfferEntity {
  id: string;
  submissionId: string;
  jobId: string;
  candidateId: string;
  employerId: string;
  salary: number;
  benefits: string;
  status: string;
  sentAt?: Date | null;
  respondedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const offerMapper: RdfMapper<OfferEntity> = {
  entityType: "Offer",
  classUri: classUri("Offer"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Offer", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Offer")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:submissionId", entity.submissionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:jobId", entity.jobId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:candidateId", entity.candidateId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:employerId", entity.employerId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:salary", entity.salary, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:benefits", entity.benefits, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.sentAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sentAt", entity.sentAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.respondedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:respondedAt", entity.respondedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
