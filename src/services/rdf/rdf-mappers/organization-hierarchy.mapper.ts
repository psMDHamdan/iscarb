/**
 * OrganizationHierarchy entity mapper — converts Prisma OrganizationHierarchy to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OrganizationHierarchyEntity {
  id: string;
  parentId: string;
  childId: string;
  level: number;
  path?: string | null;
}

export const organizationHierarchyMapper: RdfMapper<OrganizationHierarchyEntity> = {
  entityType: "OrganizationHierarchy",
  classUri: classUri("OrganizationHierarchy"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OrganizationHierarchy", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OrganizationHierarchy")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:parentId", entity.parentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:childId", entity.childId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:level", entity.level, "xsd:decimal"));
    if (entity.path != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:path", entity.path, "xsd:string"));
    }

    return { triples, graph };
  },
};
