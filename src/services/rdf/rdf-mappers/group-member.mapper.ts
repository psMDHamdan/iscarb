/**
 * GroupMember entity mapper — converts Prisma GroupMember to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GroupMemberEntity {
  id: string;
  groupId: string;
  group: string;
  userId: string;
  role: string;
  joinedAt: Date;
  expiresAt?: Date | null;
}

export const groupMemberMapper: RdfMapper<GroupMemberEntity> = {
  entityType: "GroupMember",
  classUri: classUri("GroupMember"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("GroupMember", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("GroupMember")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:groupId", entity.groupId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:group", entity.group, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:joinedAt", entity.joinedAt.toISOString(), "xsd:dateTime"));
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
