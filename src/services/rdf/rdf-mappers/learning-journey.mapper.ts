/**
 * LearningJourney entity mapper — converts Prisma LearningJourney to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LearningJourneyEntity {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  goal?: string | null;
  status: string;
  progress: number;
  startDate: Date;
  targetDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const learningJourneyMapper: RdfMapper<LearningJourneyEntity> = {
  entityType: "LearningJourney",
  classUri: classUri("LearningJourney"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LearningJourney", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LearningJourney")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.goal != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:goal", entity.goal, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:progress", entity.progress, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    if (entity.targetDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetDate", entity.targetDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
