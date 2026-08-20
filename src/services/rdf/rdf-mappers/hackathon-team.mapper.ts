/**
 * HackathonTeam entity mapper — converts Prisma HackathonTeam to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface HackathonTeamEntity {
  id: string;
  hackathonId: string;
  name: string;
  description?: string | null;
  projectTitle?: string | null;
  projectSummary?: string | null;
  projectUrl?: string | null;
  demoUrl?: string | null;
  score?: number | null;
  rank?: number | null;
  prizeWonSAR?: number | null;
  judgeNotes?: string | null;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const hackathonTeamMapper: RdfMapper<HackathonTeamEntity> = {
  entityType: "HackathonTeam",
  classUri: classUri("HackathonTeam"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("HackathonTeam", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("HackathonTeam")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:hackathonId", entity.hackathonId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.projectTitle != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:projectTitle", entity.projectTitle, "xsd:string"));
    }
    if (entity.projectSummary != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:projectSummary", entity.projectSummary, "xsd:string"));
    }
    if (entity.projectUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:projectUrl", entity.projectUrl, "xsd:string"));
    }
    if (entity.demoUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:demoUrl", entity.demoUrl, "xsd:string"));
    }
    if (entity.score != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    }
    if (entity.rank != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rank", entity.rank, "xsd:decimal"));
    }
    if (entity.prizeWonSAR != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:prizeWonSAR", entity.prizeWonSAR, "xsd:decimal"));
    }
    if (entity.judgeNotes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:judgeNotes", entity.judgeNotes, "xsd:string"));
    }
    if (entity.submittedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:submittedAt", entity.submittedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
