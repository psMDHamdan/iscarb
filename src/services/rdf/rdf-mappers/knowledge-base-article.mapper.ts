/**
 * KnowledgeBaseArticle entity mapper — converts Prisma KnowledgeBaseArticle to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeBaseArticleEntity {
  id: string;
  topicId: string;
  topic: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  authorId?: string | null;
  author?: string | null;
  order: number;
  difficulty: string;
  estimatedReadTime?: number | null;
  tags: string;
  relatedArticleIds?: string | null;
  viewCount: number;
  likes: number;
  shares: number;
  helpfulCount: number;
  notHelpfulCount: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
}

export const knowledgeBaseArticleMapper: RdfMapper<KnowledgeBaseArticleEntity> = {
  entityType: "KnowledgeBaseArticle",
  classUri: classUri("KnowledgeBaseArticle"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeBaseArticle", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeBaseArticle")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:topicId", entity.topicId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:topic", entity.topic, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:slug", entity.slug, "xsd:string"));
    if (entity.excerpt != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:excerpt", entity.excerpt, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.authorId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    }
    if (entity.author != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:author", entity.author, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:difficulty", entity.difficulty, "xsd:string"));
    if (entity.estimatedReadTime != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:estimatedReadTime", entity.estimatedReadTime, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:tags", entity.tags, "xsd:string"));
    if (entity.relatedArticleIds != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:relatedArticleIds", entity.relatedArticleIds, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:viewCount", entity.viewCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:likes", entity.likes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:shares", entity.shares, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:helpfulCount", entity.helpfulCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:notHelpfulCount", entity.notHelpfulCount, "xsd:decimal"));
    if (entity.metaTitle != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metaTitle", entity.metaTitle, "xsd:string"));
    }
    if (entity.metaDescription != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metaDescription", entity.metaDescription, "xsd:string"));
    }
    if (entity.keywords != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:keywords", entity.keywords, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublished", entity.isPublished, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isFeatured", entity.isFeatured, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    if (entity.publishedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:publishedAt", entity.publishedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
