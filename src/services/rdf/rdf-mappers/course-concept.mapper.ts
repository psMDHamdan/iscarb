/**
 * CourseConcept entity mapper — converts Prisma CourseConcept to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CourseConceptEntity {
  id: string;
  courseId: string;
  conceptId: string;
  concept: string;
}

export const courseConceptMapper: RdfMapper<CourseConceptEntity> = {
  entityType: "CourseConcept",
  classUri: classUri("CourseConcept"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CourseConcept", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CourseConcept")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:conceptId", entity.conceptId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:concept", entity.concept, "xsd:string"));

    return { triples, graph };
  },
};
