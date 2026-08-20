/**
 * MonthlyLearningGoal entity mapper — converts Prisma MonthlyLearningGoal to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MonthlyLearningGoalEntity {
  id: string;
  journeyId: string;
  title: string;
  targetMinutes: number;
  actualMinutes: number;
  monthStart: Date;
  monthEnd: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  journey: string;
}

export const monthlyLearningGoalMapper: RdfMapper<MonthlyLearningGoalEntity> = {
  entityType: "MonthlyLearningGoal",
  classUri: classUri("MonthlyLearningGoal"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("MonthlyLearningGoal", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("MonthlyLearningGoal")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:journeyId", entity.journeyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetMinutes", entity.targetMinutes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:actualMinutes", entity.actualMinutes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:monthStart", entity.monthStart.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:monthEnd", entity.monthEnd.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:completed", entity.completed, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:journey", entity.journey, "xsd:string"));

    return { triples, graph };
  },
};
