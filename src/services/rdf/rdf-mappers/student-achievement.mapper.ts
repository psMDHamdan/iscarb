/**
 * StudentAchievement entity mapper — converts Prisma StudentAchievement to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentAchievementEntity {
  id: string;
  universityId: string;
  studentId: string;
  title: string;
  description?: string | null;
  category: string;
  badgeIcon?: string | null;
  rarity: string;
  progress: number;
  requirement: string;
}

export const studentAchievementMapper: RdfMapper<StudentAchievementEntity> = {
  entityType: "StudentAchievement",
  classUri: classUri("StudentAchievement"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentAchievement", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentAchievement")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.badgeIcon != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:badgeIcon", entity.badgeIcon, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:rarity", entity.rarity, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:progress", entity.progress, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:requirement", entity.requirement, "xsd:string"));

    return { triples, graph };
  },
};
