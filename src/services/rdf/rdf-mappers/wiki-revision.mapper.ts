/**
 * WikiRevision entity mapper — converts Prisma WikiRevision to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WikiRevisionEntity {
  id: string;
  pageId: string;
  page: string;
  content?: string | null;
  authorId: string;
  changelog?: string | null;
  createdAt: Date;
}

export const wikiRevisionMapper: RdfMapper<WikiRevisionEntity> = {
  entityType: "WikiRevision",
  classUri: classUri("WikiRevision"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WikiRevision", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WikiRevision")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:pageId", entity.pageId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:page", entity.page, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    if (entity.changelog != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:changelog", entity.changelog, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
