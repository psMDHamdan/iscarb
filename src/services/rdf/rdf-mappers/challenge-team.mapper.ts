/**
 * ChallengeTeam entity mapper — converts Prisma ChallengeTeam to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ChallengeTeamEntity {
  id: string;
  challengeId: string;
  name: string;
  score?: number | null;
  createdAt: Date;
}

export const challengeTeamMapper: RdfMapper<ChallengeTeamEntity> = {
  entityType: "ChallengeTeam",
  classUri: classUri("ChallengeTeam"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ChallengeTeam", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ChallengeTeam")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:challengeId", entity.challengeId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.score != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
