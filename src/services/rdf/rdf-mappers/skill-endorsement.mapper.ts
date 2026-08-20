/**
 * SkillEndorsement entity mapper — converts Prisma SkillEndorsement to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SkillEndorsementEntity {
  id: string;
  skillId: string;
  skill: string;
  portfolioId: string;
  endorsedBy: string;
  status: string;
  message?: string | null;
  endorsedAt: Date;
  respondedAt?: Date | null;
}

export const skillEndorsementMapper: RdfMapper<SkillEndorsementEntity> = {
  entityType: "SkillEndorsement",
  classUri: classUri("SkillEndorsement"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SkillEndorsement", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SkillEndorsement")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:skillId", entity.skillId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skill", entity.skill, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:portfolioId", entity.portfolioId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endorsedBy", entity.endorsedBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.message != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:message", entity.message, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:endorsedAt", entity.endorsedAt.toISOString(), "xsd:dateTime"));
    if (entity.respondedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:respondedAt", entity.respondedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
