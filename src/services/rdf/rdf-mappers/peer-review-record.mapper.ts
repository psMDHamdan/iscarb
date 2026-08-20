/**
 * PeerReviewRecord entity mapper — converts Prisma PeerReviewRecord to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PeerReviewRecordEntity {
  id: string;
  paperId: string;
  reviewerId: string;
  rating?: number | null;
  comments?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const peerReviewRecordMapper: RdfMapper<PeerReviewRecordEntity> = {
  entityType: "PeerReviewRecord",
  classUri: classUri("PeerReviewRecord"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PeerReviewRecord", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PeerReviewRecord")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:paperId", entity.paperId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:reviewerId", entity.reviewerId, "xsd:string"));
    if (entity.rating != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:decimal"));
    }
    if (entity.comments != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:comments", entity.comments, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
