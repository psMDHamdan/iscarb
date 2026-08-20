/**
 * DigitalCredential entity mapper — converts Prisma DigitalCredential to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DigitalCredentialEntity {
  id: string;
  studentId: string;
  credentialType: string;
  title: string;
  issuer: string;
  issuedDate: Date;
  expiryDate?: Date | null;
  verificationUrl?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const digitalCredentialMapper: RdfMapper<DigitalCredentialEntity> = {
  entityType: "DigitalCredential",
  classUri: classUri("DigitalCredential"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DigitalCredential", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DigitalCredential")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:credentialType", entity.credentialType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:issuer", entity.issuer, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:issuedDate", entity.issuedDate.toISOString(), "xsd:dateTime"));
    if (entity.expiryDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiryDate", entity.expiryDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.verificationUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:verificationUrl", entity.verificationUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
