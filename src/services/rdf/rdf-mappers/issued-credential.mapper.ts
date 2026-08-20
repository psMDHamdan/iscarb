/**
 * IssuedCredential entity mapper — converts Prisma IssuedCredential to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface IssuedCredentialEntity {
  id: string;
  studentId: string;
  type: string;
  titleEn: string;
  titleAr: string;
  claimsJson: string;
}

export const issuedCredentialMapper: RdfMapper<IssuedCredentialEntity> = {
  entityType: "IssuedCredential",
  classUri: classUri("IssuedCredential"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("IssuedCredential", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("IssuedCredential")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleEn", entity.titleEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:claimsJson", entity.claimsJson, "xsd:string"));

    return { triples, graph };
  },
};
