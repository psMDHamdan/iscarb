/**
 * Discussion entity mapper — converts Prisma Discussion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DiscussionEntity {
  id: string;
  title: string;
  content: string;
  authorId: string;
  category: string;
  organizationId?: string | null;
  status: string;
  replyCount: number;
  lastReplyAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const discussionMapper: RdfMapper<DiscussionEntity> = {
  entityType: "Discussion",
  classUri: classUri("Discussion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Discussion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Discussion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:replyCount", entity.replyCount, "xsd:decimal"));
    if (entity.lastReplyAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastReplyAt", entity.lastReplyAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
