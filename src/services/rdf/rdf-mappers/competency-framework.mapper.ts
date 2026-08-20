/**
 * CompetencyFramework entity mapper — converts Prisma CompetencyFramework to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CompetencyFrameworkEntity {
  id: string;
  name: string;
  description?: string | null;
  version: string;
  status: string;
  organizationId?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const competencyFrameworkMapper: RdfMapper<CompetencyFrameworkEntity> = {
  entityType: "CompetencyFramework",
  classUri: classUri("CompetencyFramework"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CompetencyFramework", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CompetencyFramework")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.createdBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
