/**
 * SharedResource entity mapper — converts Prisma SharedResource to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SharedResourceEntity {
  id: string;
  departmentId?: string | null;
  sharedById: string;
  title: string;
  description?: string | null;
  resourceType: string;
  fileKey?: string | null;
  url?: string | null;
  universityId?: string | null;
  createdAt: Date;
}

export const sharedResourceMapper: RdfMapper<SharedResourceEntity> = {
  entityType: "SharedResource",
  classUri: classUri("SharedResource"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SharedResource", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SharedResource")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.departmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:departmentId", entity.departmentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:sharedById", entity.sharedById, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:resourceType", entity.resourceType, "xsd:string"));
    if (entity.fileKey != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:fileKey", entity.fileKey, "xsd:string"));
    }
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
