/**
 * Conversation entity mapper — converts Prisma Conversation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ConversationEntity {
  id: string;
  title: string;
  type: string;
  creatorId: string;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const conversationMapper: RdfMapper<ConversationEntity> = {
  entityType: "Conversation",
  classUri: classUri("Conversation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Conversation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Conversation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:creatorId", entity.creatorId, "xsd:string"));
    if (entity.lastMessageAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastMessageAt", entity.lastMessageAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
