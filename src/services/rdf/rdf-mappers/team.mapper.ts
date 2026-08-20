/**
 * Team entity mapper — converts Prisma Team to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface TeamEntity {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  departmentId?: string | null;
  leaderId?: string | null;
  status: string;
  organizationId?: string | null;
  metadata?: string | null;
}

export const teamMapper: RdfMapper<TeamEntity> = {
  entityType: "Team",
  classUri: classUri("Team"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Team", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Team")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.nameAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    }
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.departmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:departmentId", entity.departmentId, "xsd:string"));
    }
    if (entity.leaderId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:leaderId", entity.leaderId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
