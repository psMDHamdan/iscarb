/**
 * ContentItem entity mapper — converts Prisma ContentItem to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ContentItemEntity {
  id: string;
  facultyId: string;
  courseId?: string | null;
  title: string;
  contentType: string;
  content: string;
  metadata: string;
}

export const contentItemMapper: RdfMapper<ContentItemEntity> = {
  entityType: "ContentItem",
  classUri: classUri("ContentItem"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ContentItem", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ContentItem")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:contentType", entity.contentType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));

    return { triples, graph };
  },
};
