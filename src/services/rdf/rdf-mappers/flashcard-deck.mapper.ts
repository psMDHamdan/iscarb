/**
 * FlashcardDeck entity mapper — converts Prisma FlashcardDeck to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FlashcardDeckEntity {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  courseId?: string | null;
  isPublic: boolean;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const flashcardDeckMapper: RdfMapper<FlashcardDeckEntity> = {
  entityType: "FlashcardDeck",
  classUri: classUri("FlashcardDeck"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FlashcardDeck", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FlashcardDeck")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublic", entity.isPublic, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:cardCount", entity.cardCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
