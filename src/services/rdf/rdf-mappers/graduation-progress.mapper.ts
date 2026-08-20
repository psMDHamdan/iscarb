/**
 * GraduationProgress entity mapper — converts Prisma GraduationProgress to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GraduationProgressEntity {
  id: string;
  studentId: string;
  programId: string;
  creditsEarned: number;
  creditsRequired: number;
  gpaCurrent?: number | null;
  gpaRequired?: number | null;
  status: string;
  estimatedGraduation?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const graduationProgressMapper: RdfMapper<GraduationProgressEntity> = {
  entityType: "GraduationProgress",
  classUri: classUri("GraduationProgress"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("GraduationProgress", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("GraduationProgress")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:creditsEarned", entity.creditsEarned, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:creditsRequired", entity.creditsRequired, "xsd:decimal"));
    if (entity.gpaCurrent != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:gpaCurrent", entity.gpaCurrent, "xsd:decimal"));
    }
    if (entity.gpaRequired != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:gpaRequired", entity.gpaRequired, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.estimatedGraduation) {
      triples.push(rdfLiteralTriple(uri, "iscarb:estimatedGraduation", entity.estimatedGraduation.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
