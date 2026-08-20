/**
 * Announcement entity mapper — converts Prisma Announcement to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AnnouncementEntity {
  id: string;
  title: string;
  titleAr?: string | null;
  content: string;
  contentAr?: string | null;
  type: string;
  publishedBy: string;
  publishedByType: string;
  status: string;
  visibility: string;
  imageUrl?: string | null;
  priority: number;
  expiresAt?: Date | null;
  likes: number;
  shares: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
}

export const announcementMapper: RdfMapper<AnnouncementEntity> = {
  entityType: "Announcement",
  classUri: classUri("Announcement"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Announcement", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Announcement")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.titleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.contentAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:contentAr", entity.contentAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:publishedBy", entity.publishedBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:publishedByType", entity.publishedByType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:visibility", entity.visibility, "xsd:string"));
    if (entity.imageUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:imageUrl", entity.imageUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:decimal"));
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:likes", entity.likes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:shares", entity.shares, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:comments", entity.comments, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
