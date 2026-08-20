/**
 * FacultyCertification entity mapper — converts Prisma FacultyCertification to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyCertificationEntity {
  id: string;
  facultyId: string;
  name: string;
  issuer?: string | null;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  credentialId?: string | null;
  url?: string | null;
  status: string;
  universityId?: string | null;
  createdAt: Date;
}

export const facultyCertificationMapper: RdfMapper<FacultyCertificationEntity> = {
  entityType: "FacultyCertification",
  classUri: classUri("FacultyCertification"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyCertification", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyCertification")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.issuer != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:issuer", entity.issuer, "xsd:string"));
    }
    if (entity.issueDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:issueDate", entity.issueDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.expiryDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiryDate", entity.expiryDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.credentialId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:credentialId", entity.credentialId, "xsd:string"));
    }
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
