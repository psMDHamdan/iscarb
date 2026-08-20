/**
 * RdfSyncState entity mapper — converts Prisma RdfSyncState to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface RdfSyncStateEntity {
  id: string;
  entityType: string;
  entityId: string;
  universityCode: string;
  lastSyncedAt: Date;
  syncVersion: number;
  tripleCount: number;
  status: string;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const rdfSyncStateMapper: RdfMapper<RdfSyncStateEntity> = {
  entityType: "RdfSyncState",
  classUri: classUri("RdfSyncState"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("RdfSyncState", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("RdfSyncState")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:universityCode", entity.universityCode, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:lastSyncedAt", entity.lastSyncedAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:syncVersion", entity.syncVersion, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:tripleCount", entity.tripleCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.errorMessage != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:errorMessage", entity.errorMessage, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
