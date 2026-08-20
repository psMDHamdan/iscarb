/**
 * ResearchNotebook entity mapper — converts Prisma ResearchNotebook to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchNotebookEntity {
  id: string;
  projectId: string;
  project: string;
  authorId: string;
  title: string;
  content?: string | null;
  tags?: string | null;
  attachments?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const researchNotebookMapper: RdfMapper<ResearchNotebookEntity> = {
  entityType: "ResearchNotebook",
  classUri: classUri("ResearchNotebook"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchNotebook", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchNotebook")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:project", entity.project, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    if (entity.tags != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:tags", entity.tags, "xsd:string"));
    }
    if (entity.attachments != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:attachments", entity.attachments, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
