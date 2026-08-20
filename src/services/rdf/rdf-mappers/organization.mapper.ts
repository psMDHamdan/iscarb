/**
 * Organization entity mapper — converts Prisma Organization to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OrganizationEntity {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  type: string;
  status: string;
  governmentId?: string | null;
  countryId?: string | null;
  parentId?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  domain?: string | null;
  ssoEnabled: boolean;
  ssoProvider?: string | null;
  ssoConfig?: string | null;
}

export const organizationMapper: RdfMapper<OrganizationEntity> = {
  entityType: "Organization",
  classUri: classUri("Organization"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Organization", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Organization")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.nameAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:slug", entity.slug, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.governmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:governmentId", entity.governmentId, "xsd:string"));
    }
    if (entity.countryId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:countryId", entity.countryId, "xsd:string"));
    }
    if (entity.parentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentId", entity.parentId, "xsd:string"));
    }
    if (entity.website != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:website", entity.website, "xsd:string"));
    }
    if (entity.email != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:email", entity.email, "xsd:string"));
    }
    if (entity.phone != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:phone", entity.phone, "xsd:string"));
    }
    if (entity.logoUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:logoUrl", entity.logoUrl, "xsd:string"));
    }
    if (entity.primaryColor != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:primaryColor", entity.primaryColor, "xsd:string"));
    }
    if (entity.address != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:address", entity.address, "xsd:string"));
    }
    if (entity.city != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:city", entity.city, "xsd:string"));
    }
    if (entity.state != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:state", entity.state, "xsd:string"));
    }
    if (entity.postalCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:postalCode", entity.postalCode, "xsd:string"));
    }
    if (entity.domain != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:domain", entity.domain, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:ssoEnabled", entity.ssoEnabled, "xsd:boolean"));
    if (entity.ssoProvider != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ssoProvider", entity.ssoProvider, "xsd:string"));
    }
    if (entity.ssoConfig != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ssoConfig", entity.ssoConfig, "xsd:string"));
    }

    return { triples, graph };
  },
};
