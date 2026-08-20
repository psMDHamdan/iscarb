/**
 * CommunityReply entity mapper — converts Prisma CommunityReply to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CommunityReplyEntity {
  id: string;
  postId: string;
  post: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: Date;
}

export const communityReplyMapper: RdfMapper<CommunityReplyEntity> = {
  entityType: "CommunityReply",
  classUri: classUri("CommunityReply"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CommunityReply", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CommunityReply")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:postId", entity.postId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:post", entity.post, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:authorName", entity.authorName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:authorRole", entity.authorRole, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
