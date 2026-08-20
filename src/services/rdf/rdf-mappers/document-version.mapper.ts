/**
 * DocumentVersion entity mapper — converts Prisma DocumentVersion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DocumentVersionEntity {
  id: string;
  documentId: string;
  version: number;
  content?: string | null;
  authorId: string;
  changelog?: string | null;
  createdAt: Date;
}

export const documentVersionMapper: RdfMapper<DocumentVersionEntity> = {
  entityType: "DocumentVersion",
  classUri: classUri("DocumentVersion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DocumentVersion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DocumentVersion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:documentId", entity.documentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
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
