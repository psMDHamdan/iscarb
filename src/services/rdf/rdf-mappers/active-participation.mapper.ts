/**
 * ActiveParticipation entity mapper — converts Prisma ActiveParticipation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ActiveParticipationEntity {
  id: string;
  studentId: string;
  courseId: string;
  unitId?: string | null;
  interactionsCount: number;
  avgInputQuality: number;
  aiConfidence: number;
  promptsAccepted: number;
  peerEndorsements: number;
  promptQualityScore: number;
  recordedAt: Date;
  universityId?: string | null;
}

export const activeParticipationMapper: RdfMapper<ActiveParticipationEntity> = {
  entityType: "ActiveParticipation",
  classUri: classUri("ActiveParticipation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ActiveParticipation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ActiveParticipation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    if (entity.unitId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:unitId", entity.unitId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:interactionsCount", entity.interactionsCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:avgInputQuality", entity.avgInputQuality, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:aiConfidence", entity.aiConfidence, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:promptsAccepted", entity.promptsAccepted, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:peerEndorsements", entity.peerEndorsements, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:promptQualityScore", entity.promptQualityScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:recordedAt", entity.recordedAt.toISOString(), "xsd:dateTime"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }

    return { triples, graph };
  },
};
