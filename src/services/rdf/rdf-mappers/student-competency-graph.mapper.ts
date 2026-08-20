/**
 * StudentCompetencyGraph entity mapper — converts Prisma StudentCompetencyGraph to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentCompetencyGraphEntity {
  id: string;
  studentId: string;
  competencyId: string;
  currentLevel: number;
  targetLevel: number;
  trend: number;
  lastAssessedAt?: Date | null;
  assessmentCount: number;
  evidence?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const studentCompetencyGraphMapper: RdfMapper<StudentCompetencyGraphEntity> = {
  entityType: "StudentCompetencyGraph",
  classUri: classUri("StudentCompetencyGraph"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentCompetencyGraph", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentCompetencyGraph")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:competencyId", entity.competencyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:currentLevel", entity.currentLevel, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetLevel", entity.targetLevel, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:trend", entity.trend, "xsd:decimal"));
    if (entity.lastAssessedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastAssessedAt", entity.lastAssessedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:assessmentCount", entity.assessmentCount, "xsd:decimal"));
    if (entity.evidence != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:evidence", entity.evidence, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
