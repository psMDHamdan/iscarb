/**
 * JobMatch entity mapper — converts Prisma JobMatch to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JobMatchEntity {
  id: string;
  studentId: string;
  jobId: string;
  matchScore: number;
  sscoScore: number;
  compositeScore: number;
  skillsScore: number;
  vision2030Bonus: number;
  breakdownJson?: string | null;
  computedAt: Date;
}

export const jobMatchMapper: RdfMapper<JobMatchEntity> = {
  entityType: "JobMatch",
  classUri: classUri("JobMatch"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JobMatch", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JobMatch")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:jobId", entity.jobId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:matchScore", entity.matchScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sscoScore", entity.sscoScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:compositeScore", entity.compositeScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skillsScore", entity.skillsScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:vision2030Bonus", entity.vision2030Bonus, "xsd:decimal"));
    if (entity.breakdownJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:breakdownJson", entity.breakdownJson, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:computedAt", entity.computedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
