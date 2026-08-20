/**
 * HabitTracker entity mapper — converts Prisma HabitTracker to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface HabitTrackerEntity {
  id: string;
  userId: string;
  habitName: string;
  description?: string | null;
  frequency: string;
  targetCount: number;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  lastCompletedAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const habitTrackerMapper: RdfMapper<HabitTrackerEntity> = {
  entityType: "HabitTracker",
  classUri: classUri("HabitTracker"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("HabitTracker", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("HabitTracker")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:habitName", entity.habitName, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:frequency", entity.frequency, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetCount", entity.targetCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:currentStreak", entity.currentStreak, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:bestStreak", entity.bestStreak, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:totalCompletions", entity.totalCompletions, "xsd:decimal"));
    if (entity.lastCompletedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastCompletedAt", entity.lastCompletedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
