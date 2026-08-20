/**
 * Campus entity mapper — converts Prisma Campus to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CampusEntity {
  id: string;
  organizationId: string;
  name: string;
  location?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const campusMapper: RdfMapper<CampusEntity> = {
  entityType: "Campus",
  classUri: classUri("Campus"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Campus", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Campus")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.location != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
