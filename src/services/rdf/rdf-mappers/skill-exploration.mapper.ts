/**
 * SkillExploration entity mapper — converts Prisma SkillExploration to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SkillExplorationEntity {
  id: string;
  studentId: string;
  skillName: string;
  sscoCode?: string | null;
  status: string;
  notes?: string | null;
  discoveredAt: Date;
  updatedAt: Date;
}

export const skillExplorationMapper: RdfMapper<SkillExplorationEntity> = {
  entityType: "SkillExploration",
  classUri: classUri("SkillExploration"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SkillExploration", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SkillExploration")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skillName", entity.skillName, "xsd:string"));
    if (entity.sscoCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sscoCode", entity.sscoCode, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:discoveredAt", entity.discoveredAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
