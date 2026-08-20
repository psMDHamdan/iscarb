/**
 * WeeklyLearningGoal entity mapper — converts Prisma WeeklyLearningGoal to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WeeklyLearningGoalEntity {
  id: string;
  journeyId: string;
  title: string;
  targetMinutes: number;
  actualMinutes: number;
  weekStart: Date;
  weekEnd: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  journey: string;
}

export const weeklyLearningGoalMapper: RdfMapper<WeeklyLearningGoalEntity> = {
  entityType: "WeeklyLearningGoal",
  classUri: classUri("WeeklyLearningGoal"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WeeklyLearningGoal", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WeeklyLearningGoal")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:journeyId", entity.journeyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetMinutes", entity.targetMinutes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:actualMinutes", entity.actualMinutes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:weekStart", entity.weekStart.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:weekEnd", entity.weekEnd.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:completed", entity.completed, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:journey", entity.journey, "xsd:string"));

    return { triples, graph };
  },
};
