/**
 * HackathonTeamMember entity mapper — converts Prisma HackathonTeamMember to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface HackathonTeamMemberEntity {
  id: string;
  teamId: string;
  studentId: string;
  role: string;
  projectId?: string | null;
  joinedAt: Date;
}

export const hackathonTeamMemberMapper: RdfMapper<HackathonTeamMemberEntity> = {
  entityType: "HackathonTeamMember",
  classUri: classUri("HackathonTeamMember"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("HackathonTeamMember", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("HackathonTeamMember")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:teamId", entity.teamId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));
    if (entity.projectId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:joinedAt", entity.joinedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
