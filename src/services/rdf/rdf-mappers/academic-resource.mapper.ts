/**
 * AcademicResource entity mapper — converts Prisma AcademicResource to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AcademicResourceEntity {
  id: string;
  courseId: string;
  title: string;
  type: string;
  url?: string | null;
  filePath?: string | null;
  description?: string | null;
  author?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const academicResourceMapper: RdfMapper<AcademicResourceEntity> = {
  entityType: "AcademicResource",
  classUri: classUri("AcademicResource"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AcademicResource", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AcademicResource")),
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
    if (entity.author != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:author", entity.author, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
