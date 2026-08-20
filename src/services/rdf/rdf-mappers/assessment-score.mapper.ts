/**
 * AssessmentScore entity mapper — converts Prisma AssessmentScore to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AssessmentScoreEntity {
  id: string;
  submissionId: string;
  criterionId: string;
  criterion: string;
  score: number;
  maxScore: number;
  provider: string;
  confidence: number;
  feedback?: string | null;
  scoredBy?: string | null;
  scoredAt: Date;
}

export const assessmentScoreMapper: RdfMapper<AssessmentScoreEntity> = {
  entityType: "AssessmentScore",
  classUri: classUri("AssessmentScore"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AssessmentScore", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AssessmentScore")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:submissionId", entity.submissionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:criterionId", entity.criterionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:criterion", entity.criterion, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:maxScore", entity.maxScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:provider", entity.provider, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:confidence", entity.confidence, "xsd:decimal"));
    if (entity.feedback != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:feedback", entity.feedback, "xsd:string"));
    }
    if (entity.scoredBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:scoredBy", entity.scoredBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:scoredAt", entity.scoredAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
