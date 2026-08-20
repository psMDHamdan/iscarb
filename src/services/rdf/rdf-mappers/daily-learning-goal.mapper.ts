/**
 * DailyLearningGoal entity mapper — converts Prisma DailyLearningGoal to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DailyLearningGoalEntity {
  id: string;
  journeyId: string;
  title: string;
  targetMinutes: number;
  actualMinutes: number;
  date: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  journey: string;
}

export const dailyLearningGoalMapper: RdfMapper<DailyLearningGoalEntity> = {
  entityType: "DailyLearningGoal",
  classUri: classUri("DailyLearningGoal"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DailyLearningGoal", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DailyLearningGoal")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:journeyId", entity.journeyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetMinutes", entity.targetMinutes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:actualMinutes", entity.actualMinutes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:date", entity.date.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:completed", entity.completed, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:journey", entity.journey, "xsd:string"));

    return { triples, graph };
  },
};
