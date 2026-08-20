/**
 * CompetencyEvidence entity mapper — converts Prisma CompetencyEvidence to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CompetencyEvidenceEntity {
  id: string;
  studentId: string;
  competencyId: string;
  competencyName: string;
  evidenceType: string;
  evidenceId: string;
  evidenceName: string;
  confidenceScore: number;
  earnedAt: Date;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  createdAt: Date;
}

export const competencyEvidenceMapper: RdfMapper<CompetencyEvidenceEntity> = {
  entityType: "CompetencyEvidence",
  classUri: classUri("CompetencyEvidence"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CompetencyEvidence", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CompetencyEvidence")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:competencyId", entity.competencyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:competencyName", entity.competencyName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:evidenceType", entity.evidenceType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:evidenceId", entity.evidenceId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:evidenceName", entity.evidenceName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:confidenceScore", entity.confidenceScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:earnedAt", entity.earnedAt.toISOString(), "xsd:dateTime"));
    if (entity.verifiedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:verifiedAt", entity.verifiedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.verifiedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:verifiedBy", entity.verifiedBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
