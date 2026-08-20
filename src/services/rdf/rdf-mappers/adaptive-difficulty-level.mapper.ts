/**
 * AdaptiveDifficultyLevel entity mapper — converts Prisma AdaptiveDifficultyLevel to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AdaptiveDifficultyLevelEntity {
  id: string;
  studentId: string;
  courseId: string;
  assessmentId?: string | null;
  difficultyMultiplier: number;
  updatedAt: Date;
  createdAt: Date;
}

export const adaptiveDifficultyLevelMapper: RdfMapper<AdaptiveDifficultyLevelEntity> = {
  entityType: "AdaptiveDifficultyLevel",
  classUri: classUri("AdaptiveDifficultyLevel"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AdaptiveDifficultyLevel", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AdaptiveDifficultyLevel")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    if (entity.assessmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:assessmentId", entity.assessmentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:difficultyMultiplier", entity.difficultyMultiplier, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
