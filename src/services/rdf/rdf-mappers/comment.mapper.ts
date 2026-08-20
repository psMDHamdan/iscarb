/**
 * Comment entity mapper — converts Prisma Comment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CommentEntity {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const commentMapper: RdfMapper<CommentEntity> = {
  entityType: "Comment",
  classUri: classUri("Comment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Comment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Comment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.parentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentId", entity.parentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
