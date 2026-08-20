/**
 * WorkflowStepExecution entity mapper — converts Prisma WorkflowStepExecution to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WorkflowStepExecutionEntity {
  id: string;
  executionId: string;
  execution: string;
  stepId: string;
  stepOrder: number;
  status: string;
  result: string;
}

export const workflowStepExecutionMapper: RdfMapper<WorkflowStepExecutionEntity> = {
  entityType: "WorkflowStepExecution",
  classUri: classUri("WorkflowStepExecution"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WorkflowStepExecution", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WorkflowStepExecution")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:executionId", entity.executionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:execution", entity.execution, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:stepId", entity.stepId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:stepOrder", entity.stepOrder, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:result", entity.result, "xsd:string"));

    return { triples, graph };
  },
};
