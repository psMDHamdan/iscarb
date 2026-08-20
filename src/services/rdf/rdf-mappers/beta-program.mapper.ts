/**
 * BetaProgram entity mapper — converts Prisma BetaProgram to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface BetaProgramEntity {
  id: string;
  name: string;
  description?: string | null;
  featureKey: string;
  status: string;
  maxEnrollments?: number | null;
  enrollmentCount: number;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
}

export const betaProgramMapper: RdfMapper<BetaProgramEntity> = {
  entityType: "BetaProgram",
  classUri: classUri("BetaProgram"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("BetaProgram", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("BetaProgram")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:featureKey", entity.featureKey, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.maxEnrollments != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:maxEnrollments", entity.maxEnrollments, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:enrollmentCount", entity.enrollmentCount, "xsd:decimal"));
    if (entity.startDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
