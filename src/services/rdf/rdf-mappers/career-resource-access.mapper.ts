/**
 * CareerResourceAccess entity mapper — converts Prisma CareerResourceAccess to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerResourceAccessEntity {
  id: string;
  studentId: string;
  resourceType: string;
  resourceTitle: string;
  resourceUrl?: string | null;
  accessedAt: Date;
  bookmarked: boolean;
  universityId?: string | null;
}

export const careerResourceAccessMapper: RdfMapper<CareerResourceAccessEntity> = {
  entityType: "CareerResourceAccess",
  classUri: classUri("CareerResourceAccess"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerResourceAccess", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerResourceAccess")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:resourceType", entity.resourceType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:resourceTitle", entity.resourceTitle, "xsd:string"));
    if (entity.resourceUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:resourceUrl", entity.resourceUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:accessedAt", entity.accessedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:bookmarked", entity.bookmarked, "xsd:boolean"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }

    return { triples, graph };
  },
};
