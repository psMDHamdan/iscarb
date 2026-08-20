/**
 * ResearchPaper entity mapper — converts Prisma ResearchPaper to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchPaperEntity {
  id: string;
  title: string;
  abstract?: string | null;
  authors?: string | null;
  doi?: string | null;
  journal?: string | null;
  year?: number | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  url?: string | null;
  organizationId?: string | null;
  authorId?: string | null;
  status: string;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const researchPaperMapper: RdfMapper<ResearchPaperEntity> = {
  entityType: "ResearchPaper",
  classUri: classUri("ResearchPaper"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchPaper", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchPaper")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.abstract != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:abstract", entity.abstract, "xsd:string"));
    }
    if (entity.authors != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:authors", entity.authors, "xsd:string"));
    }
    if (entity.doi != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:doi", entity.doi, "xsd:string"));
    }
    if (entity.journal != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:journal", entity.journal, "xsd:string"));
    }
    if (entity.year != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:year", entity.year, "xsd:decimal"));
    }
    if (entity.volume != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:volume", entity.volume, "xsd:string"));
    }
    if (entity.issue != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:issue", entity.issue, "xsd:string"));
    }
    if (entity.pages != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:pages", entity.pages, "xsd:string"));
    }
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.authorId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
