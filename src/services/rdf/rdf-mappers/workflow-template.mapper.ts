/**
 * WorkflowTemplate entity mapper — converts Prisma WorkflowTemplate to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface WorkflowTemplateEntity {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  icon?: string | null;
  thumbnail?: string | null;
  workflowConfig: string;
  usageCount: number;
  isPublic: boolean;
  createdById?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const workflowTemplateMapper: RdfMapper<WorkflowTemplateEntity> = {
  entityType: "WorkflowTemplate",
  classUri: classUri("WorkflowTemplate"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("WorkflowTemplate", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("WorkflowTemplate")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.icon != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:icon", entity.icon, "xsd:string"));
    }
    if (entity.thumbnail != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:thumbnail", entity.thumbnail, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:workflowConfig", entity.workflowConfig, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:usageCount", entity.usageCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublic", entity.isPublic, "xsd:boolean"));
    if (entity.createdById != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdById", entity.createdById, "xsd:string"));
    }
    if (entity.createdBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
