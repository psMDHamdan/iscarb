/**
 * Message entity mapper — converts Prisma Message to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MessageEntity {
  id: string;
  conversationId: string;
  conversation: string;
  senderId: string;
  senderType: string;
  recipientId?: string | null;
  subject?: string | null;
  body: string;
  readAt?: Date | null;
  starred: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const messageMapper: RdfMapper<MessageEntity> = {
  entityType: "Message",
  classUri: classUri("Message"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Message", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Message")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:conversationId", entity.conversationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:conversation", entity.conversation, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:senderId", entity.senderId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:senderType", entity.senderType, "xsd:string"));
    if (entity.recipientId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recipientId", entity.recipientId, "xsd:string"));
    }
    if (entity.subject != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:subject", entity.subject, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:body", entity.body, "xsd:string"));
    if (entity.readAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:readAt", entity.readAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:starred", entity.starred, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:archived", entity.archived, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
