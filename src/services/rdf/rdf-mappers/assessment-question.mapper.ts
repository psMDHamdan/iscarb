/**
 * AssessmentQuestion entity mapper — converts Prisma AssessmentQuestion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AssessmentQuestionEntity {
  id: string;
  assessmentId: string;
  order: number;
  type: string;
  prompt: string;
  instructionsJson?: string | null;
  pointsPossible: number;
  rubricCriterionId?: string | null;
  rubricCriterion?: string | null;
  optionsJson?: string | null;
}

export const assessmentQuestionMapper: RdfMapper<AssessmentQuestionEntity> = {
  entityType: "AssessmentQuestion",
  classUri: classUri("AssessmentQuestion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AssessmentQuestion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AssessmentQuestion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:assessmentId", entity.assessmentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:prompt", entity.prompt, "xsd:string"));
    if (entity.instructionsJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:instructionsJson", entity.instructionsJson, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:pointsPossible", entity.pointsPossible, "xsd:decimal"));
    if (entity.rubricCriterionId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rubricCriterionId", entity.rubricCriterionId, "xsd:string"));
    }
    if (entity.rubricCriterion != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rubricCriterion", entity.rubricCriterion, "xsd:string"));
    }
    if (entity.optionsJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:optionsJson", entity.optionsJson, "xsd:string"));
    }

    return { triples, graph };
  },
};
