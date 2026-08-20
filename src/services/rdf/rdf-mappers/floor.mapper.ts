/**
 * Floor entity mapper — converts Prisma Floor to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FloorEntity {
  id: string;
  buildingId: string;
  building: string;
  name: string;
  number: number;
  level?: string | null;
  area?: number | null;
  createdAt: Date;
}

export const floorMapper: RdfMapper<FloorEntity> = {
  entityType: "Floor",
  classUri: classUri("Floor"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Floor", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Floor")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:buildingId", entity.buildingId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:building", entity.building, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:number", entity.number, "xsd:decimal"));
    if (entity.level != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:level", entity.level, "xsd:string"));
    }
    if (entity.area != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:area", entity.area, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
