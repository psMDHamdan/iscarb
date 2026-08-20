/**
 * Room entity mapper — converts Prisma Room to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface RoomEntity {
  id: string;
  floorId: string;
  floor: string;
  name: string;
  type: string;
  capacity: number;
  area?: number | null;
  hasProjector: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  hasWhiteboard: boolean;
  status: string;
  metadata?: string | null;
}

export const roomMapper: RdfMapper<RoomEntity> = {
  entityType: "Room",
  classUri: classUri("Room"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Room", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Room")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:floorId", entity.floorId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:floor", entity.floor, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:capacity", entity.capacity, "xsd:decimal"));
    if (entity.area != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:area", entity.area, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:hasProjector", entity.hasProjector, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:hasAudio", entity.hasAudio, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:hasVideo", entity.hasVideo, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:hasWhiteboard", entity.hasWhiteboard, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
