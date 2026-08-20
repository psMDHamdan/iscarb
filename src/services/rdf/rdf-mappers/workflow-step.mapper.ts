/**
 * WorkflowStep entity mapper — converts Prisma WorkflowStep to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WorkflowStepEntity {
  id: string;
  workflowId: string;
  name: string;
  description?: string | null;
  stepType: string;
  order: number;
  actionType?: string | null;
  actionConfig: string;
}

export const workflowStepMapper: RdfMapper<WorkflowStepEntity> = {
  entityType: "WorkflowStep",
  classUri: classUri("WorkflowStep"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WorkflowStep", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WorkflowStep")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:workflowId", entity.workflowId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:stepType", entity.stepType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    if (entity.actionType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:actionType", entity.actionType, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:actionConfig", entity.actionConfig, "xsd:string"));

    return { triples, graph };
  },
};
