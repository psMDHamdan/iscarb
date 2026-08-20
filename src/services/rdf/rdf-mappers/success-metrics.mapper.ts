/**
 * SuccessMetrics entity mapper — converts Prisma SuccessMetrics to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SuccessMetricsEntity {
  id: string;
  universityId: string;
  studentId: string;
  overallScore: number;
  weeklyGrowth: number;
  streak: number;
  totalGoals: number;
  goalsCompleted: number;
  badgesEarned: number;
  metricDate: Date;
  lastUpdatedAt: Date;
  createdAt: Date;
}

export const successMetricsMapper: RdfMapper<SuccessMetricsEntity> = {
  entityType: "SuccessMetrics",
  classUri: classUri("SuccessMetrics"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SuccessMetrics", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SuccessMetrics")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:overallScore", entity.overallScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:weeklyGrowth", entity.weeklyGrowth, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:streak", entity.streak, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:totalGoals", entity.totalGoals, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:goalsCompleted", entity.goalsCompleted, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:badgesEarned", entity.badgesEarned, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metricDate", entity.metricDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:lastUpdatedAt", entity.lastUpdatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
