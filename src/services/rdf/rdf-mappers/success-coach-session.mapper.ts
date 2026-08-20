/**
 * SuccessCoachSession entity mapper — converts Prisma SuccessCoachSession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SuccessCoachSessionEntity {
  id: string;
  universityId: string;
  studentId: string;
  sessionTopic: string;
  userPrompt: string;
  aiResponse: string;
  feedbackProvided: boolean;
  supportOffered?: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: Date;
}

export const successCoachSessionMapper: RdfMapper<SuccessCoachSessionEntity> = {
  entityType: "SuccessCoachSession",
  classUri: classUri("SuccessCoachSession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SuccessCoachSession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SuccessCoachSession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sessionTopic", entity.sessionTopic, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userPrompt", entity.userPrompt, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:aiResponse", entity.aiResponse, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:feedbackProvided", entity.feedbackProvided, "xsd:boolean"));
    if (entity.supportOffered != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:supportOffered", entity.supportOffered, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:inputTokens", entity.inputTokens, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:outputTokens", entity.outputTokens, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
