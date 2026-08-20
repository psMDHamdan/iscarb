/**
 * OrganizationInvitation entity mapper — converts Prisma OrganizationInvitation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OrganizationInvitationEntity {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  status: string;
  token: string;
  message?: string | null;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
}

export const organizationInvitationMapper: RdfMapper<OrganizationInvitationEntity> = {
  entityType: "OrganizationInvitation",
  classUri: classUri("OrganizationInvitation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OrganizationInvitation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OrganizationInvitation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:email", entity.email, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:invitedBy", entity.invitedBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:token", entity.token, "xsd:string"));
    if (entity.message != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:message", entity.message, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    if (entity.acceptedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:acceptedAt", entity.acceptedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
