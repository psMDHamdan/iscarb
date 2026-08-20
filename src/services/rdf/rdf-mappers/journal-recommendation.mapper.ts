/**
 * JournalRecommendation entity mapper — converts Prisma JournalRecommendation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JournalRecommendationEntity {
  id: string;
  publicationId: string;
  publication: string;
  journalName: string;
  impactFactor: number;
  relevanceScore: number;
  reason?: string | null;
  createdAt: Date;
}

export const journalRecommendationMapper: RdfMapper<JournalRecommendationEntity> = {
  entityType: "JournalRecommendation",
  classUri: classUri("JournalRecommendation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JournalRecommendation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JournalRecommendation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:publicationId", entity.publicationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:publication", entity.publication, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:journalName", entity.journalName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:impactFactor", entity.impactFactor, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:relevanceScore", entity.relevanceScore, "xsd:decimal"));
    if (entity.reason != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reason", entity.reason, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
