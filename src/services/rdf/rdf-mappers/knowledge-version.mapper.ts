/**
 * KnowledgeVersion entity mapper — converts Prisma KnowledgeVersion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeVersionEntity {
  id: string;
  entityType: string;
  entityId: string;
  version: number;
  content?: string | null;
  authorId: string;
  changelog?: string | null;
  createdAt: Date;
}

export const knowledgeVersionMapper: RdfMapper<KnowledgeVersionEntity> = {
  entityType: "KnowledgeVersion",
  classUri: classUri("KnowledgeVersion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeVersion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeVersion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
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
