/**
 * Challenge entity mapper — converts Prisma Challenge to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ChallengeEntity {
  id: string;
  company: string;
  sector: string;
  title: string;
  brief: string;
  difficulty: string;
  skillsJson: string;
  reward?: string | null;
  deadline?: Date | null;
  status: string;
  createdAt: Date;
}

export const challengeMapper: RdfMapper<ChallengeEntity> = {
  entityType: "Challenge",
  classUri: classUri("Challenge"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Challenge", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Challenge")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:company", entity.company, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sector", entity.sector, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:brief", entity.brief, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:difficulty", entity.difficulty, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skillsJson", entity.skillsJson, "xsd:string"));
    if (entity.reward != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reward", entity.reward, "xsd:string"));
    }
    if (entity.deadline) {
      triples.push(rdfLiteralTriple(uri, "iscarb:deadline", entity.deadline.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
