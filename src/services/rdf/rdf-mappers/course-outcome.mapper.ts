/**
 * CourseOutcome entity mapper — converts Prisma CourseOutcome to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CourseOutcomeEntity {
  id: string;
  courseId: string;
  description: string;
  bloomsLevel: string;
  order: number;
  createdAt: Date;
}

export const courseOutcomeMapper: RdfMapper<CourseOutcomeEntity> = {
  entityType: "CourseOutcome",
  classUri: classUri("CourseOutcome"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CourseOutcome", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CourseOutcome")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:bloomsLevel", entity.bloomsLevel, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
