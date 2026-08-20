/**
 * StudentLearningProfile entity mapper — converts Prisma StudentLearningProfile to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentLearningProfileEntity {
  id: string;
  studentId: string;
  preferredLearningStyle?: string | null;
  studyPacePreference?: string | null;
  focusSessionDurationMinutes?: number | null;
  bestStudyTime?: string | null;
  avgStudySessionLength?: number | null;
  preferredResourceTypes: string;
  adaptiveDifficultyLevel?: number | null;
  lastUpdatedAt: Date;
  createdAt: Date;
}

export const studentLearningProfileMapper: RdfMapper<StudentLearningProfileEntity> = {
  entityType: "StudentLearningProfile",
  classUri: classUri("StudentLearningProfile"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentLearningProfile", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentLearningProfile")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.preferredLearningStyle != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:preferredLearningStyle", entity.preferredLearningStyle, "xsd:string"));
    }
    if (entity.studyPacePreference != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:studyPacePreference", entity.studyPacePreference, "xsd:string"));
    }
    if (entity.focusSessionDurationMinutes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:focusSessionDurationMinutes", entity.focusSessionDurationMinutes, "xsd:decimal"));
    }
    if (entity.bestStudyTime != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bestStudyTime", entity.bestStudyTime, "xsd:string"));
    }
    if (entity.avgStudySessionLength != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:avgStudySessionLength", entity.avgStudySessionLength, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:preferredResourceTypes", entity.preferredResourceTypes, "xsd:string"));
    if (entity.adaptiveDifficultyLevel != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:adaptiveDifficultyLevel", entity.adaptiveDifficultyLevel, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:lastUpdatedAt", entity.lastUpdatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
