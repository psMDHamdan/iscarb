/**
 * SkillProgress entity mapper — converts Prisma SkillProgress to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SkillProgressEntity {
  id: string;
  studentId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
}

export const skillProgressMapper: RdfMapper<SkillProgressEntity> = {
  entityType: "SkillProgress",
  classUri: classUri("SkillProgress"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SkillProgress", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SkillProgress")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skillName", entity.skillName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:currentLevel", entity.currentLevel, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetLevel", entity.targetLevel, "xsd:decimal"));

    return { triples, graph };
  },
};
