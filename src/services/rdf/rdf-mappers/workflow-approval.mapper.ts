/**
 * WorkflowApproval entity mapper — converts Prisma WorkflowApproval to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WorkflowApprovalEntity {
  id: string;
  workflowId: string;
  executionId: string;
  stepId: string;
  status: string;
  approverIds: string;
  createdAt: Date;
  expiresAt?: Date | null;
}

export const workflowApprovalMapper: RdfMapper<WorkflowApprovalEntity> = {
  entityType: "WorkflowApproval",
  classUri: classUri("WorkflowApproval"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WorkflowApproval", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WorkflowApproval")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:workflowId", entity.workflowId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:executionId", entity.executionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:stepId", entity.stepId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:approverIds", entity.approverIds, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
