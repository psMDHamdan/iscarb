/**
 * DiscussionReply entity mapper — converts Prisma DiscussionReply to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DiscussionReplyEntity {
  id: string;
  discussionId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const discussionReplyMapper: RdfMapper<DiscussionReplyEntity> = {
  entityType: "DiscussionReply",
  classUri: classUri("DiscussionReply"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DiscussionReply", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DiscussionReply")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:discussionId", entity.discussionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.parentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentId", entity.parentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
