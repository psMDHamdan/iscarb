import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AbacPolicyEntity {
  id: string;
  name: string;
  organizationId: string;
  resource: string;
  permission: string;
  effect: string;
  conditionExpression: string;
  priority: number;
  enabled: boolean;
  createdAt?: Date;
}

export const abacPolicyMapper: RdfMapper<AbacPolicyEntity> = {
  entityType: "AbacPolicy",
  classUri: classUri("AbacPolicy"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AbacPolicy", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AbacPolicy")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:resource", entity.resource, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:permission", entity.permission, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:effect", entity.effect, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:conditionExpression", entity.conditionExpression, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:integer"),
      rdfLiteralTriple(uri, "iscarb:enabled", entity.enabled, "xsd:boolean"),
      rdfTriple(uri, "iscarb:belongsToOrganization", instanceUri("Organization", universityCode, entity.organizationId)),
    ];

    if (entity.createdAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph, uri };
  },

  fromTriples(triples) {
    // simplified fromTriples for basic entity
    return {};
  },
};
