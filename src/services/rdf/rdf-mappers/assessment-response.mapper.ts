/**
 * AssessmentResponse entity mapper — converts Prisma AssessmentResponse to RDF triples.
 * Maps to the iscarb:AssessmentResponse class with scoring, band, and criterion data.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfTriple, rdfLiteralTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";
import { normalizeScoringSource } from "@/lib/assessment/scoring-source";

interface AssessmentResponseEntity {
  id: string;
  studentId: string;
  moduleCode: string;
  dimension: string;
  specialization?: string | null;
  score: number;
  band: string;
  passed: boolean;
  perCriterionJson: string;
  feedback: string;
  strengthsJson: string;
  improvementsJson: string;
  validationPassed?: boolean | null;
  model: string;
  source: string;
  rawResponse?: string | null;
  latencyMs?: number;
  createdAt?: Date;
}

export const assessmentResponseMapper: RdfMapper<AssessmentResponseEntity> = {
  entityType: "AssessmentResponse",
  classUri: classUri("AssessmentResponse"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AssessmentResponse", universityCode, entity.id);
    const graph = universityGraph(universityCode);
    const studentUri = instanceUri("Student", universityCode, entity.studentId);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AssessmentResponse")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:moduleCode", entity.moduleCode, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:dimension", entity.dimension, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"),
      rdfLiteralTriple(uri, "iscarb:band", entity.band, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:passed", entity.passed, "xsd:boolean"),
      rdfLiteralTriple(uri, "iscarb:feedback", entity.feedback, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:scoringSource", normalizeScoringSource(entity.source), "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:modelUsed", entity.model, "xsd:string"),
      // Link to student
      rdfTriple(uri, "iscarb:submittedBy", studentUri),
      rdfTriple(studentUri, "iscarb:hasResponse", uri),
    ];

    if (entity.specialization) {
      triples.push(rdfLiteralTriple(uri, "iscarb:specialization", entity.specialization, "xsd:string"));
    }
    if (entity.rawResponse) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rawResponse", entity.rawResponse, "xsd:string"));
    }
    if (entity.validationPassed != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:validationPassed", entity.validationPassed, "xsd:boolean"));
    }
    if (entity.latencyMs != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:latencyMs", entity.latencyMs, "xsd:integer"));
    }
    if (entity.createdAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    }

    // Parse per-criterion scores as blank nodes
    try {
      const criteria = JSON.parse(entity.perCriterionJson) as Array<{
        criterion: string;
        score: number;
        maxScore: number;
        feedback?: string;
      }>;
      for (const c of criteria) {
        const criterionUri = `${uri}/criterion/${encodeURIComponent(c.criterion)}`;
        triples.push(
          rdfTriple(uri, "iscarb:hasCriterionScore", criterionUri),
          rdfTriple(criterionUri, "rdf:type", classUri("RubricCriterion")),
          rdfLiteralTriple(criterionUri, "iscarb:criterionName", c.criterion, "xsd:string"),
          rdfLiteralTriple(criterionUri, "iscarb:score", c.score, "xsd:decimal"),
          rdfLiteralTriple(criterionUri, "iscarb:maxScore", c.maxScore, "xsd:decimal"),
        );
        if (c.feedback) {
          triples.push(rdfLiteralTriple(criterionUri, "iscarb:feedback", c.feedback, "xsd:string"));
        }
      }
    } catch {
      // If JSON parsing fails, store as literal
      triples.push(rdfLiteralTriple(uri, "iscarb:perCriterionJson", entity.perCriterionJson, "xsd:string"));
    }

    // Parse strengths and improvements
    try {
      const strengths = JSON.parse(entity.strengthsJson) as string[];
      for (const s of strengths) {
        triples.push(rdfLiteralTriple(uri, "iscarb:strength", s, "xsd:string"));
      }
    } catch { /* skip */ }

    try {
      const improvements = JSON.parse(entity.improvementsJson) as string[];
      for (const i of improvements) {
        triples.push(rdfLiteralTriple(uri, "iscarb:improvement", i, "xsd:string"));
      }
    } catch { /* skip */ }

    // Link to module as a typed node
    const moduleUri = instanceUri("AssessmentModule", universityCode, entity.moduleCode);
    triples.push(
      rdfTriple(uri, "iscarb:responseForModule", moduleUri),
      rdfTriple(moduleUri, "rdf:type", classUri("AssessmentModule")),
      rdfLiteralTriple(moduleUri, "iscarb:moduleCode", entity.moduleCode, "xsd:string"),
    );

    return { graph, uri, triples };
  },

  fromTriples(triples) {
    const findVal = (p: string) => {
      const v = triples.find((t) => t.p === p)?.o;
      return typeof v === "object" ? v.value : v;
    };

    return {
      id: findVal("iscarb:hasId"),
      moduleCode: findVal("iscarb:moduleCode"),
      dimension: findVal("iscarb:dimension"),
      score: parseFloat(findVal("iscarb:score") || "0"),
      band: findVal("iscarb:band"),
      passed: findVal("iscarb:passed") === "true",
      feedback: findVal("iscarb:feedback"),
      source: findVal("iscarb:scoringSource"),
      model: findVal("iscarb:modelUsed"),
      specialization: findVal("iscarb:specialization") || null,
      rawResponse: findVal("iscarb:rawResponse") || null,
    };
  },
};
