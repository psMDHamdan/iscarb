/**
 * InstitutionCollaboration entity mapper — converts Prisma InstitutionCollaboration to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface InstitutionCollaborationEntity {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: string;
  organizations: string;
  config: string;
}

export const institutionCollaborationMapper: RdfMapper<InstitutionCollaborationEntity> = {
  entityType: "InstitutionCollaboration",
  classUri: classUri("InstitutionCollaboration"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("InstitutionCollaboration", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("InstitutionCollaboration")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:organizations", entity.organizations, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));

    return { triples, graph };
  },
};
