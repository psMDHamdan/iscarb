/**
 * AIGeneratedQuiz entity mapper — converts Prisma AIGeneratedQuiz to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AIGeneratedQuizEntity {
  id: string;
  studentId: string;
  courseId?: string | null;
  topic?: string | null;
  questionCount: number;
  difficulty: string;
  score?: number | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const aigeneratedQuizMapper: RdfMapper<AIGeneratedQuizEntity> = {
  entityType: "AIGeneratedQuiz",
  classUri: classUri("AIGeneratedQuiz"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AIGeneratedQuiz", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AIGeneratedQuiz")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    if (entity.topic != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:topic", entity.topic, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:questionCount", entity.questionCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:difficulty", entity.difficulty, "xsd:string"));
    if (entity.score != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
