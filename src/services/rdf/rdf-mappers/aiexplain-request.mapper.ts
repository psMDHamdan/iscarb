/**
 * AIExplainRequest entity mapper — converts Prisma AIExplainRequest to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AIExplainRequestEntity {
  id: string;
  studentId: string;
  topic: string;
  mode: string;
  language: string;
  response?: string | null;
  rating?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const aiexplainRequestMapper: RdfMapper<AIExplainRequestEntity> = {
  entityType: "AIExplainRequest",
  classUri: classUri("AIExplainRequest"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AIExplainRequest", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AIExplainRequest")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:topic", entity.topic, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:mode", entity.mode, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:language", entity.language, "xsd:string"));
    if (entity.response != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:response", entity.response, "xsd:string"));
    }
    if (entity.rating != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
