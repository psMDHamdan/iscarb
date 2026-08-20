/**
 * WorkflowExecution entity mapper — converts Prisma WorkflowExecution to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WorkflowExecutionEntity {
  id: string;
  workflowId: string;
  status: string;
  triggerData: string;
}

export const workflowExecutionMapper: RdfMapper<WorkflowExecutionEntity> = {
  entityType: "WorkflowExecution",
  classUri: classUri("WorkflowExecution"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WorkflowExecution", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WorkflowExecution")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:workflowId", entity.workflowId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:triggerData", entity.triggerData, "xsd:string"));

    return { triples, graph };
  },
};
