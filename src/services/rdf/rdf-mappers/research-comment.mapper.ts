/**
 * ResearchComment entity mapper — converts Prisma ResearchComment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchCommentEntity {
  id: string;
  entityType: string;
  entityId: string;
  authorId: string;
  content?: string | null;
  parentCommentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const researchCommentMapper: RdfMapper<ResearchCommentEntity> = {
  entityType: "ResearchComment",
  classUri: classUri("ResearchComment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchComment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchComment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    if (entity.parentCommentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentCommentId", entity.parentCommentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
