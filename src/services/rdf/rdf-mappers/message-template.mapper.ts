/**
 * MessageTemplate entity mapper — converts Prisma MessageTemplate to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MessageTemplateEntity {
  id: string;
  name: string;
  category: string;
  subject?: string | null;
  bodyTemplate: string;
}

export const messageTemplateMapper: RdfMapper<MessageTemplateEntity> = {
  entityType: "MessageTemplate",
  classUri: classUri("MessageTemplate"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("MessageTemplate", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("MessageTemplate")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.subject != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:subject", entity.subject, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:bodyTemplate", entity.bodyTemplate, "xsd:string"));

    return { triples, graph };
  },
};
