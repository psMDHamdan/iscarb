/**
 * CourseResource entity mapper — converts Prisma CourseResource to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CourseResourceEntity {
  id: string;
  courseId: string;
  title: string;
  type: string;
  url?: string | null;
  filePath?: string | null;
  description?: string | null;
  order: number;
  createdAt: Date;
}

export const courseResourceMapper: RdfMapper<CourseResourceEntity> = {
  entityType: "CourseResource",
  classUri: classUri("CourseResource"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CourseResource", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CourseResource")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    if (entity.filePath != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:filePath", entity.filePath, "xsd:string"));
    }
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
