/**
 * ResearchProtocol entity mapper — converts Prisma ResearchProtocol to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchProtocolEntity {
  id: string;
  title: string;
  description?: string | null;
  authorId: string;
  organizationId?: string | null;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const researchProtocolMapper: RdfMapper<ResearchProtocolEntity> = {
  entityType: "ResearchProtocol",
  classUri: classUri("ResearchProtocol"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchProtocol", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchProtocol")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
