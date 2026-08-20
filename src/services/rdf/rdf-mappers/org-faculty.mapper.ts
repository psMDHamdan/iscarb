/**
 * OrgFaculty entity mapper — converts Prisma OrgFaculty to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OrgFacultyEntity {
  id: string;
  organizationId: string;
  campusId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const orgFacultyMapper: RdfMapper<OrgFacultyEntity> = {
  entityType: "OrgFaculty",
  classUri: classUri("OrgFaculty"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OrgFaculty", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OrgFaculty")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:campusId", entity.campusId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
