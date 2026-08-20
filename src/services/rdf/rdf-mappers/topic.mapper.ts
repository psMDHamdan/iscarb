/**
 * Topic entity mapper — converts Prisma Topic to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface TopicEntity {
  id: string;
  moduleId: string;
  module: string;
  title: string;
  description?: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export const topicMapper: RdfMapper<TopicEntity> = {
  entityType: "Topic",
  classUri: classUri("Topic"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Topic", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Topic")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:moduleId", entity.moduleId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:module", entity.module, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
