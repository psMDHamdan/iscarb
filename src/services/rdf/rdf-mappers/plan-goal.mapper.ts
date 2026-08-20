/**
 * PlanGoal entity mapper — converts Prisma PlanGoal to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PlanGoalEntity {
  id: string;
  planId: string;
  title: string;
  description?: string | null;
  status: string;
  priority: number;
  dueDate?: Date | null;
  completedAt?: Date | null;
  dependencies?: string | null;
  createdAt: Date;
}

export const planGoalMapper: RdfMapper<PlanGoalEntity> = {
  entityType: "PlanGoal",
  classUri: classUri("PlanGoal"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PlanGoal", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PlanGoal")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:planId", entity.planId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:decimal"));
    if (entity.dueDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dueDate", entity.dueDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.dependencies != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dependencies", entity.dependencies, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
