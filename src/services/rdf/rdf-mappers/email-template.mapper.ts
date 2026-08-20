/**
 * EmailTemplate entity mapper — converts Prisma EmailTemplate to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface EmailTemplateEntity {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables?: string | null;
  category: string;
  organizationId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const emailTemplateMapper: RdfMapper<EmailTemplateEntity> = {
  entityType: "EmailTemplate",
  classUri: classUri("EmailTemplate"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("EmailTemplate", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("EmailTemplate")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:subject", entity.subject, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:body", entity.body, "xsd:string"));
    if (entity.variables != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:variables", entity.variables, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
