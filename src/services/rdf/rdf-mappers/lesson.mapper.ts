/**
 * Lesson entity mapper — converts Prisma Lesson to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LessonEntity {
  id: string;
  topicId: string;
  topic: string;
  title: string;
  type: string;
  content?: string | null;
  duration?: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export const lessonMapper: RdfMapper<LessonEntity> = {
  entityType: "Lesson",
  classUri: classUri("Lesson"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Lesson", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Lesson")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:topicId", entity.topicId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:topic", entity.topic, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    if (entity.duration != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:duration", entity.duration, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
