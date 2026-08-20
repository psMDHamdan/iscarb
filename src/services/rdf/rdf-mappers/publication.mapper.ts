/**
 * Publication entity mapper — converts Prisma Publication to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PublicationEntity {
  id: string;
  title: string;
  abstract?: string | null;
  authors?: string | null;
  journal?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  doi?: string | null;
  year?: number | null;
  status: string;
  submittedDate?: Date | null;
  acceptedDate?: Date | null;
  publishedDate?: Date | null;
  impactFactor?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const publicationMapper: RdfMapper<PublicationEntity> = {
  entityType: "Publication",
  classUri: classUri("Publication"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Publication", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Publication")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.abstract != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:abstract", entity.abstract, "xsd:string"));
    }
    if (entity.authors != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:authors", entity.authors, "xsd:string"));
    }
    if (entity.journal != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:journal", entity.journal, "xsd:string"));
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
    if (entity.doi != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:doi", entity.doi, "xsd:string"));
    }
    if (entity.year != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:year", entity.year, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.submittedDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:submittedDate", entity.submittedDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.acceptedDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:acceptedDate", entity.acceptedDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.publishedDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:publishedDate", entity.publishedDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.impactFactor != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:impactFactor", entity.impactFactor, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
