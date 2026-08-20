/**
 * Building entity mapper — converts Prisma Building to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface BuildingEntity {
  id: string;
  organizationId: string;
  campusId?: string | null;
  name: string;
  type: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area?: number | null;
  yearBuilt?: number | null;
  status: string;
  metadata?: string | null;
}

export const buildingMapper: RdfMapper<BuildingEntity> = {
  entityType: "Building",
  classUri: classUri("Building"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Building", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Building")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    if (entity.campusId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:campusId", entity.campusId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.address != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:address", entity.address, "xsd:string"));
    }
    if (entity.latitude != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:latitude", entity.latitude, "xsd:decimal"));
    }
    if (entity.longitude != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:longitude", entity.longitude, "xsd:decimal"));
    }
    if (entity.area != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:area", entity.area, "xsd:decimal"));
    }
    if (entity.yearBuilt != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:yearBuilt", entity.yearBuilt, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
