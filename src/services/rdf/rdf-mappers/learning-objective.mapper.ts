/**
 * LearningObjective entity mapper — converts Prisma LearningObjective to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LearningObjectiveEntity {
  id: string;
  lessonId: string;
  lesson: string;
  description: string;
  bloomsLevel: string;
  createdAt: Date;
}

export const learningObjectiveMapper: RdfMapper<LearningObjectiveEntity> = {
  entityType: "LearningObjective",
  classUri: classUri("LearningObjective"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LearningObjective", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LearningObjective")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:lessonId", entity.lessonId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:lesson", entity.lesson, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:bloomsLevel", entity.bloomsLevel, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
