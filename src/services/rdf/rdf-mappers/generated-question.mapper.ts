import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GeneratedQuestionEntity {
  id: string;
  assessmentId: string;
  courseId: string;
  type: string;
  bloomLevel: string;
  difficulty: string;
  prompt: string;
  promptAr?: string | null;
  correctAnswer?: string | null;
}

export const generatedQuestionMapper: RdfMapper<GeneratedQuestionEntity> = {
  entityType: "GeneratedQuestion",
  classUri: classUri("GeneratedQuestion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("GeneratedQuestion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("GeneratedQuestion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfTriple(uri, "iscarb:belongsToAssessment", instanceUri("Assessment", universityCode, entity.assessmentId)),
      rdfTriple(uri, "iscarb:belongsToCourse", instanceUri("Course", universityCode, entity.courseId)),
      rdfLiteralTriple(uri, "iscarb:questionType", entity.type, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:bloomLevel", entity.bloomLevel, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:difficulty", entity.difficulty, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:prompt", entity.prompt, "xsd:string"),
    ];

    if (entity.promptAr) {
      triples.push(rdfLiteralTriple(uri, "iscarb:promptAr", entity.promptAr, "xsd:string"));
    }
    if (entity.correctAnswer) {
      triples.push(rdfLiteralTriple(uri, "iscarb:correctAnswer", entity.correctAnswer, "xsd:string"));
    }

    return { triples, graph, uri };
  },

  fromTriples(triples) {
    return {};
  },
};
