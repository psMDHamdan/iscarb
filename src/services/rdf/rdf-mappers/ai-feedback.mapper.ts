/**
 * AiFeedback entity mapper — converts Prisma AiFeedback to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiFeedbackEntity {
  id: string;
  sessionId?: string | null;
  userId: string;
  rating: number;
  comment?: string | null;
  helpful?: boolean | null;
  category?: string | null;
  createdAt: Date;
}

export const aiFeedbackMapper: RdfMapper<AiFeedbackEntity> = {
  entityType: "AiFeedback",
  classUri: classUri("AiFeedback"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiFeedback", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiFeedback")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.sessionId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:decimal"));
    if (entity.comment != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:comment", entity.comment, "xsd:string"));
    }
    if (entity.helpful != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:helpful", entity.helpful, "xsd:boolean"));
    }
    if (entity.category != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
