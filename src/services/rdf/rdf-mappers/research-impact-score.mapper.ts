/**
 * ResearchImpactScore entity mapper — converts Prisma ResearchImpactScore to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchImpactScoreEntity {
  id: string;
  researcherId: string;
  projectId?: string | null;
  score: number;
  breakdown?: string | null;
  calculatedAt: Date;
}

export const researchImpactScoreMapper: RdfMapper<ResearchImpactScoreEntity> = {
  entityType: "ResearchImpactScore",
  classUri: classUri("ResearchImpactScore"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchImpactScore", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchImpactScore")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:researcherId", entity.researcherId, "xsd:string"));
    if (entity.projectId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    if (entity.breakdown != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:breakdown", entity.breakdown, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:calculatedAt", entity.calculatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
