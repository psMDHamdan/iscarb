/**
 * CandidateEvaluation entity mapper — converts Prisma CandidateEvaluation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CandidateEvaluationEntity {
  id: string;
  submissionId: string;
  evaluatorId: string;
  rating: string;
  feedback: string;
  createdAt: Date;
}

export const candidateEvaluationMapper: RdfMapper<CandidateEvaluationEntity> = {
  entityType: "CandidateEvaluation",
  classUri: classUri("CandidateEvaluation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CandidateEvaluation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CandidateEvaluation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:submissionId", entity.submissionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:evaluatorId", entity.evaluatorId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:feedback", entity.feedback, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
