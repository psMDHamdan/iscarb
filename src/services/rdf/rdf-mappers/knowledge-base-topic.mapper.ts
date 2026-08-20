/**
 * KnowledgeBaseTopic entity mapper — converts Prisma KnowledgeBaseTopic to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeBaseTopicEntity {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  category: string;
  universityId?: string | null;
  parentTopicId?: string | null;
  parentTopic?: string | null;
  icon?: string | null;
  color?: string | null;
  order: number;
  tags: string;
  viewCount: number;
  likes: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
}

export const knowledgeBaseTopicMapper: RdfMapper<KnowledgeBaseTopicEntity> = {
  entityType: "KnowledgeBaseTopic",
  classUri: classUri("KnowledgeBaseTopic"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeBaseTopic", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeBaseTopic")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:slug", entity.slug, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    if (entity.parentTopicId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentTopicId", entity.parentTopicId, "xsd:string"));
    }
    if (entity.parentTopic != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentTopic", entity.parentTopic, "xsd:string"));
    }
    if (entity.icon != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:icon", entity.icon, "xsd:string"));
    }
    if (entity.color != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:color", entity.color, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:tags", entity.tags, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:viewCount", entity.viewCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:likes", entity.likes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:helpfulCount", entity.helpfulCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:notHelpfulCount", entity.notHelpfulCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublished", entity.isPublished, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    if (entity.publishedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:publishedAt", entity.publishedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
