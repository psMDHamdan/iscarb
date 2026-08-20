/**
 * WorkflowSchedule entity mapper — converts Prisma WorkflowSchedule to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WorkflowScheduleEntity {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  status: string;
  lastExecutedAt?: Date | null;
  nextExecutionAt?: Date | null;
  executionCount: number;
  maxExecutions?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const workflowScheduleMapper: RdfMapper<WorkflowScheduleEntity> = {
  entityType: "WorkflowSchedule",
  classUri: classUri("WorkflowSchedule"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WorkflowSchedule", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WorkflowSchedule")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:workflowId", entity.workflowId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:cronExpression", entity.cronExpression, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:timezone", entity.timezone, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.lastExecutedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastExecutedAt", entity.lastExecutedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.nextExecutionAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextExecutionAt", entity.nextExecutionAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:executionCount", entity.executionCount, "xsd:decimal"));
    if (entity.maxExecutions != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:maxExecutions", entity.maxExecutions, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
