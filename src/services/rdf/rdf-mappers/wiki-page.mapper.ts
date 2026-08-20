/**
 * WikiPage entity mapper — converts Prisma WikiPage to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WikiPageEntity {
  id: string;
  title: string;
  slug: string;
  content?: string | null;
  authorId: string;
  organizationId?: string | null;
  parentId?: string | null;
  status: string;
  lastEditedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const wikiPageMapper: RdfMapper<WikiPageEntity> = {
  entityType: "WikiPage",
  classUri: classUri("WikiPage"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WikiPage", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WikiPage")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:slug", entity.slug, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.parentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentId", entity.parentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.lastEditedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastEditedBy", entity.lastEditedBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
