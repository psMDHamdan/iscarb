/**
 * TalentPoolMember entity mapper — converts Prisma TalentPoolMember to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface TalentPoolMemberEntity {
  id: string;
  poolId: string;
  studentId: string;
  notes?: string | null;
  addedAt: Date;
}

export const talentPoolMemberMapper: RdfMapper<TalentPoolMemberEntity> = {
  entityType: "TalentPoolMember",
  classUri: classUri("TalentPoolMember"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("TalentPoolMember", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("TalentPoolMember")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:poolId", entity.poolId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:addedAt", entity.addedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
