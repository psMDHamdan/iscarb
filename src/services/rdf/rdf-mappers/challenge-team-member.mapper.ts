/**
 * ChallengeTeamMember entity mapper — converts Prisma ChallengeTeamMember to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ChallengeTeamMemberEntity {
  id: string;
  teamId: string;
  studentId: string;
  role: string;
}

export const challengeTeamMemberMapper: RdfMapper<ChallengeTeamMemberEntity> = {
  entityType: "ChallengeTeamMember",
  classUri: classUri("ChallengeTeamMember"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ChallengeTeamMember", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ChallengeTeamMember")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:teamId", entity.teamId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));

    return { triples, graph };
  },
};
