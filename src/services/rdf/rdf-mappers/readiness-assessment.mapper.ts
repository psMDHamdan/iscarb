/**
 * ReadinessAssessment entity mapper — converts Prisma ReadinessAssessment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReadinessAssessmentEntity {
  id: string;
  universityId: string;
  studentId: string;
  assessmentType: string;
  categories: string;
}

export const readinessAssessmentMapper: RdfMapper<ReadinessAssessmentEntity> = {
  entityType: "ReadinessAssessment",
  classUri: classUri("ReadinessAssessment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReadinessAssessment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReadinessAssessment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:assessmentType", entity.assessmentType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:categories", entity.categories, "xsd:string"));

    return { triples, graph };
  },
};
