/**
 * ConsentRecord entity mapper — converts Prisma ConsentRecord to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ConsentRecordEntity {
  id: string;
  studentId: string;
  purpose: string;
  scope?: string | null;
  granted: boolean;
  policyVersion?: string | null;
  policyHash?: string | null;
  grantedAt: Date;
  revokedAt?: Date | null;
  universityId?: string | null;
}

export const consentRecordMapper: RdfMapper<ConsentRecordEntity> = {
  entityType: "ConsentRecord",
  classUri: classUri("ConsentRecord"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ConsentRecord", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ConsentRecord")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:purpose", entity.purpose, "xsd:string"));
    if (entity.scope != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:scope", entity.scope, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:granted", entity.granted, "xsd:boolean"));
    if (entity.policyVersion != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:policyVersion", entity.policyVersion, "xsd:string"));
    }
    if (entity.policyHash != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:policyHash", entity.policyHash, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:grantedAt", entity.grantedAt.toISOString(), "xsd:dateTime"));
    if (entity.revokedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:revokedAt", entity.revokedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }

    return { triples, graph };
  },
};
