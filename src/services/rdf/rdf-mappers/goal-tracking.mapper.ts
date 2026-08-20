/**
 * GoalTracking entity mapper — converts Prisma GoalTracking to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GoalTrackingEntity {
  id: string;
  menteeId: string;
  mentee: string;
  title: string;
  description?: string | null;
  targetDate?: Date | null;
  status: string;
  progress: number;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const goalTrackingMapper: RdfMapper<GoalTrackingEntity> = {
  entityType: "GoalTracking",
  classUri: classUri("GoalTracking"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("GoalTracking", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("GoalTracking")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:menteeId", entity.menteeId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:mentee", entity.mentee, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.targetDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetDate", entity.targetDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:progress", entity.progress, "xsd:decimal"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
