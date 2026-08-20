/**
 * RiskIndicator entity mapper — converts Prisma RiskIndicator to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface RiskIndicatorEntity {
  id: string;
  universityId: string;
  studentId: string;
  riskCategory: string;
  riskLevel: string;
  score: number;
  indicators: string;
}

export const riskIndicatorMapper: RdfMapper<RiskIndicatorEntity> = {
  entityType: "RiskIndicator",
  classUri: classUri("RiskIndicator"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("RiskIndicator", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("RiskIndicator")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:riskCategory", entity.riskCategory, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:riskLevel", entity.riskLevel, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:indicators", entity.indicators, "xsd:string"));

    return { triples, graph };
  },
};
