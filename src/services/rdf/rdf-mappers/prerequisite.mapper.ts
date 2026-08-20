/**
 * Prerequisite entity mapper — converts Prisma Prerequisite to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PrerequisiteEntity {
  id: string;
  courseId: string;
  prerequisiteCourseId: string;
  type: string;
  createdAt: Date;
}

export const prerequisiteMapper: RdfMapper<PrerequisiteEntity> = {
  entityType: "Prerequisite",
  classUri: classUri("Prerequisite"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Prerequisite", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Prerequisite")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:prerequisiteCourseId", entity.prerequisiteCourseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
