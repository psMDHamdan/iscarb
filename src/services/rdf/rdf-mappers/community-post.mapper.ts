/**
 * CommunityPost entity mapper — converts Prisma CommunityPost to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CommunityPostEntity {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  category: string;
  title: string;
  content: string;
  upvotes: number;
  createdAt: Date;
}

export const communityPostMapper: RdfMapper<CommunityPostEntity> = {
  entityType: "CommunityPost",
  classUri: classUri("CommunityPost"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CommunityPost", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CommunityPost")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:authorName", entity.authorName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:authorRole", entity.authorRole, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:upvotes", entity.upvotes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
