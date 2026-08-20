/**
 * Workflow entity mapper — converts Prisma Workflow to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WorkflowEntity {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  type: string;
  status: string;
  trigger: string;
  triggerConfig: string;
}

export const workflowMapper: RdfMapper<WorkflowEntity> = {
  entityType: "Workflow",
  classUri: classUri("Workflow"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Workflow", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Workflow")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:trigger", entity.trigger, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:triggerConfig", entity.triggerConfig, "xsd:string"));

    return { triples, graph };
  },
};
