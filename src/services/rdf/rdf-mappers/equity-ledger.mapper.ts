/**
 * EquityLedger entity mapper — converts Prisma EquityLedger to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface EquityLedgerEntity {
  id: string;
  studentId: string;
  estimatedValue: number;
  equityScore: number;
  learningHours: number;
  projectsScore: number;
  challengesScore: number;
  skillsCount: number;
  breakdownJson?: string | null;
  updatedAt: Date;
  createdAt: Date;
  universityId?: string | null;
}

export const equityLedgerMapper: RdfMapper<EquityLedgerEntity> = {
  entityType: "EquityLedger",
  classUri: classUri("EquityLedger"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("EquityLedger", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("EquityLedger")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:estimatedValue", entity.estimatedValue, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:equityScore", entity.equityScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:learningHours", entity.learningHours, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:projectsScore", entity.projectsScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:challengesScore", entity.challengesScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skillsCount", entity.skillsCount, "xsd:decimal"));
    if (entity.breakdownJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:breakdownJson", entity.breakdownJson, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }

    return { triples, graph };
  },
};
