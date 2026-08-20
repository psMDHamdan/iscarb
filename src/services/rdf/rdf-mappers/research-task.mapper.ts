/**
 * ResearchTask entity mapper — converts Prisma ResearchTask to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchTaskEntity {
  id: string;
  projectId: string;
  project: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

export const researchTaskMapper: RdfMapper<ResearchTaskEntity> = {
  entityType: "ResearchTask",
  classUri: classUri("ResearchTask"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchTask", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchTask")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:project", entity.project, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.assigneeId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:assigneeId", entity.assigneeId, "xsd:string"));
    }
    if (entity.dueDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dueDate", entity.dueDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
