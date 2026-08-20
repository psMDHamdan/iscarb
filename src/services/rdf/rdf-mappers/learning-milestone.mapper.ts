/**
 * LearningMilestone entity mapper — converts Prisma LearningMilestone to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LearningMilestoneEntity {
  id: string;
  journeyId: string;
  title: string;
  description?: string | null;
  targetDate?: Date | null;
  completedAt?: Date | null;
  status: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
  journey: string;
}

export const learningMilestoneMapper: RdfMapper<LearningMilestoneEntity> = {
  entityType: "LearningMilestone",
  classUri: classUri("LearningMilestone"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LearningMilestone", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LearningMilestone")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:journeyId", entity.journeyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.targetDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetDate", entity.targetDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:points", entity.points, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:journey", entity.journey, "xsd:string"));

    return { triples, graph };
  },
};
