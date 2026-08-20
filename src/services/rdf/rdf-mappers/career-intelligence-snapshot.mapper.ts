/**
 * CareerIntelligenceSnapshot entity mapper — converts Prisma CareerIntelligenceSnapshot to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerIntelligenceSnapshotEntity {
  id: string;
  studentId: string;
  targetRole: string;
  readinessScore: number;
}

export const careerIntelligenceSnapshotMapper: RdfMapper<CareerIntelligenceSnapshotEntity> = {
  entityType: "CareerIntelligenceSnapshot",
  classUri: classUri("CareerIntelligenceSnapshot"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerIntelligenceSnapshot", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerIntelligenceSnapshot")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetRole", entity.targetRole, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:readinessScore", entity.readinessScore, "xsd:decimal"));

    return { triples, graph };
  },
};
