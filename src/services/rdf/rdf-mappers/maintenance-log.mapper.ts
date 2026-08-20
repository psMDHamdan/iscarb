/**
 * MaintenanceLog entity mapper — converts Prisma MaintenanceLog to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MaintenanceLogEntity {
  id: string;
  assetId: string;
  asset: string;
  type: string;
  description?: string | null;
  cost?: number | null;
  scheduledDate?: Date | null;
  completedDate?: Date | null;
  status: string;
  assignedTo?: string | null;
  createdAt: Date;
}

export const maintenanceLogMapper: RdfMapper<MaintenanceLogEntity> = {
  entityType: "MaintenanceLog",
  classUri: classUri("MaintenanceLog"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("MaintenanceLog", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("MaintenanceLog")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:assetId", entity.assetId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:asset", entity.asset, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.cost != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:cost", entity.cost, "xsd:decimal"));
    }
    if (entity.scheduledDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:scheduledDate", entity.scheduledDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedDate", entity.completedDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.assignedTo != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:assignedTo", entity.assignedTo, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
