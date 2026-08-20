/**
 * OrgTeam entity mapper — converts Prisma OrgTeam to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OrgTeamEntity {
  id: string;
  organizationId: string;
  programId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  program: string;
}

export const orgTeamMapper: RdfMapper<OrgTeamEntity> = {
  entityType: "OrgTeam",
  classUri: classUri("OrgTeam"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OrgTeam", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OrgTeam")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:program", entity.program, "xsd:string"));

    return { triples, graph };
  },
};
