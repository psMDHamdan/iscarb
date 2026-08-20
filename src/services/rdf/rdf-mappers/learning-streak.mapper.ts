/**
 * LearningStreak entity mapper — converts Prisma LearningStreak to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LearningStreakEntity {
  id: string;
  studentId: string;
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  lastActiveDate?: Date | null;
  freezeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const learningStreakMapper: RdfMapper<LearningStreakEntity> = {
  entityType: "LearningStreak",
  classUri: classUri("LearningStreak"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LearningStreak", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LearningStreak")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:currentStreak", entity.currentStreak, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:bestStreak", entity.bestStreak, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:totalDays", entity.totalDays, "xsd:decimal"));
    if (entity.lastActiveDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastActiveDate", entity.lastActiveDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:freezeCount", entity.freezeCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
