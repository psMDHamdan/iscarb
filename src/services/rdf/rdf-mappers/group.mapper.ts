/**
 * Group entity mapper — converts Prisma Group to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GroupEntity {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  organizationId?: string | null;
  createdBy?: string | null;
  isActive: boolean;
  metadata?: string | null;
}

export const groupMapper: RdfMapper<GroupEntity> = {
  entityType: "Group",
  classUri: classUri("Group"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Group", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Group")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.createdBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
