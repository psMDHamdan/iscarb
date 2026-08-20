/**
 * LearningResource entity mapper — converts Prisma LearningResource to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LearningResourceEntity {
  id: string;
  facultyId: string;
  courseId?: string | null;
  title: string;
  description?: string | null;
  resourceType: string;
  url?: string | null;
  fileKey?: string | null;
  visibility: string;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const learningResourceMapper: RdfMapper<LearningResourceEntity> = {
  entityType: "LearningResource",
  classUri: classUri("LearningResource"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LearningResource", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LearningResource")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:resourceType", entity.resourceType, "xsd:string"));
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    if (entity.fileKey != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:fileKey", entity.fileKey, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:visibility", entity.visibility, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
