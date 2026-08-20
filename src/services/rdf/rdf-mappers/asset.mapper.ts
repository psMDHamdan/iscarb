/**
 * Asset entity mapper — converts Prisma Asset to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AssetEntity {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  serialNumber?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  location?: string | null;
  status: string;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  currentValue?: number | null;
  warrantyExpiry?: Date | null;
  lastMaintenance?: Date | null;
  nextMaintenance?: Date | null;
  assignedTo?: string | null;
  metadata?: string | null;
}

export const assetMapper: RdfMapper<AssetEntity> = {
  entityType: "Asset",
  classUri: classUri("Asset"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Asset", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Asset")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.serialNumber != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:serialNumber", entity.serialNumber, "xsd:string"));
    }
    if (entity.model != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    }
    if (entity.manufacturer != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:manufacturer", entity.manufacturer, "xsd:string"));
    }
    if (entity.location != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.purchaseDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:purchaseDate", entity.purchaseDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.purchasePrice != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:purchasePrice", entity.purchasePrice, "xsd:decimal"));
    }
    if (entity.currentValue != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:currentValue", entity.currentValue, "xsd:decimal"));
    }
    if (entity.warrantyExpiry) {
      triples.push(rdfLiteralTriple(uri, "iscarb:warrantyExpiry", entity.warrantyExpiry.toISOString(), "xsd:dateTime"));
    }
    if (entity.lastMaintenance) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastMaintenance", entity.lastMaintenance.toISOString(), "xsd:dateTime"));
    }
    if (entity.nextMaintenance) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextMaintenance", entity.nextMaintenance.toISOString(), "xsd:dateTime"));
    }
    if (entity.assignedTo != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:assignedTo", entity.assignedTo, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
