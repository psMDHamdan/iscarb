/**
 * ProtocolTemplate entity mapper — converts Prisma ProtocolTemplate to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ProtocolTemplateEntity {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  createdBy: string;
  isPublic: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const protocolTemplateMapper: RdfMapper<ProtocolTemplateEntity> = {
  entityType: "ProtocolTemplate",
  classUri: classUri("ProtocolTemplate"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ProtocolTemplate", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ProtocolTemplate")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.category != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublic", entity.isPublic, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:useCount", entity.useCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
