/**
 * LearningChallenge entity mapper — converts Prisma LearningChallenge to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LearningChallengeEntity {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  difficulty: string;
  xpReward: number;
  startDate: Date;
  endDate?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const learningChallengeMapper: RdfMapper<LearningChallengeEntity> = {
  entityType: "LearningChallenge",
  classUri: classUri("LearningChallenge"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LearningChallenge", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LearningChallenge")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:difficulty", entity.difficulty, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:xpReward", entity.xpReward, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
