/**
 * FlashcardReview entity mapper — converts Prisma FlashcardReview to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FlashcardReviewEntity {
  id: string;
  cardId: string;
  quality: number;
  reviewedAt: Date;
  timeSpent: number;
}

export const flashcardReviewMapper: RdfMapper<FlashcardReviewEntity> = {
  entityType: "FlashcardReview",
  classUri: classUri("FlashcardReview"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FlashcardReview", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FlashcardReview")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:cardId", entity.cardId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:quality", entity.quality, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:reviewedAt", entity.reviewedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:timeSpent", entity.timeSpent, "xsd:decimal"));

    return { triples, graph };
  },
};
