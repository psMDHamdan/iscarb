/**
 * WorkflowTrigger entity mapper — converts Prisma WorkflowTrigger to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WorkflowTriggerEntity {
  id: string;
  name: string;
  eventType: string;
  description?: string | null;
  filters: string;
}

export const workflowTriggerMapper: RdfMapper<WorkflowTriggerEntity> = {
  entityType: "WorkflowTrigger",
  classUri: classUri("WorkflowTrigger"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WorkflowTrigger", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WorkflowTrigger")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:eventType", entity.eventType, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:filters", entity.filters, "xsd:string"));

    return { triples, graph };
  },
};
