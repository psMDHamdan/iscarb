/**
 * WhiteLabelConfig entity mapper — converts Prisma WhiteLabelConfig to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WhiteLabelConfigEntity {
  id: string;
  organizationId: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  customDomain?: string | null;
  emailTemplate?: string | null;
  loginPageConfig?: string | null;
  footerConfig?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const whiteLabelConfigMapper: RdfMapper<WhiteLabelConfigEntity> = {
  entityType: "WhiteLabelConfig",
  classUri: classUri("WhiteLabelConfig"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WhiteLabelConfig", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WhiteLabelConfig")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    if (entity.primaryColor != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:primaryColor", entity.primaryColor, "xsd:string"));
    }
    if (entity.secondaryColor != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:secondaryColor", entity.secondaryColor, "xsd:string"));
    }
    if (entity.logoUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:logoUrl", entity.logoUrl, "xsd:string"));
    }
    if (entity.faviconUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:faviconUrl", entity.faviconUrl, "xsd:string"));
    }
    if (entity.customDomain != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:customDomain", entity.customDomain, "xsd:string"));
    }
    if (entity.emailTemplate != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:emailTemplate", entity.emailTemplate, "xsd:string"));
    }
    if (entity.loginPageConfig != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:loginPageConfig", entity.loginPageConfig, "xsd:string"));
    }
    if (entity.footerConfig != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:footerConfig", entity.footerConfig, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
