/**
 * SpacedRepetitionItem entity mapper — converts Prisma SpacedRepetitionItem to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SpacedRepetitionItemEntity {
  id: string;
  studentId: string;
  concept: string;
  courseId?: string | null;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview?: Date | null;
  lastReview?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const spacedRepetitionItemMapper: RdfMapper<SpacedRepetitionItemEntity> = {
  entityType: "SpacedRepetitionItem",
  classUri: classUri("SpacedRepetitionItem"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SpacedRepetitionItem", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SpacedRepetitionItem")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:concept", entity.concept, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:easeFactor", entity.easeFactor, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:interval", entity.interval, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:repetitions", entity.repetitions, "xsd:decimal"));
    if (entity.nextReview) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextReview", entity.nextReview.toISOString(), "xsd:dateTime"));
    }
    if (entity.lastReview) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastReview", entity.lastReview.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
