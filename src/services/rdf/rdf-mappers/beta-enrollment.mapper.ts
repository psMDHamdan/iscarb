/**
 * BetaEnrollment entity mapper — converts Prisma BetaEnrollment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface BetaEnrollmentEntity {
  id: string;
  programId: string;
  program: string;
  userId: string;
  status: string;
  feedback?: string | null;
  enrolledAt: Date;
  completedAt?: Date | null;
}

export const betaEnrollmentMapper: RdfMapper<BetaEnrollmentEntity> = {
  entityType: "BetaEnrollment",
  classUri: classUri("BetaEnrollment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("BetaEnrollment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("BetaEnrollment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:program", entity.program, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.feedback != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:feedback", entity.feedback, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:enrolledAt", entity.enrolledAt.toISOString(), "xsd:dateTime"));
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
