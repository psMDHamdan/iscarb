/**
 * Flashcard entity mapper — converts Prisma Flashcard to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FlashcardEntity {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hints?: string | null;
  difficulty: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview?: Date | null;
  lastReviewed?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const flashcardMapper: RdfMapper<FlashcardEntity> = {
  entityType: "Flashcard",
  classUri: classUri("Flashcard"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Flashcard", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Flashcard")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:deckId", entity.deckId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:front", entity.front, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:back", entity.back, "xsd:string"));
    if (entity.hints != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hints", entity.hints, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:difficulty", entity.difficulty, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:interval", entity.interval, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:easeFactor", entity.easeFactor, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:repetitions", entity.repetitions, "xsd:decimal"));
    if (entity.nextReview) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextReview", entity.nextReview.toISOString(), "xsd:dateTime"));
    }
    if (entity.lastReviewed) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastReviewed", entity.lastReviewed.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
