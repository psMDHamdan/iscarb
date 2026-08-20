/**
 * Citation entity mapper — converts Prisma Citation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CitationEntity {
  id: string;
  paperId: string;
  paper: string;
  format: string;
  content: string;
  doi?: string | null;
  crossrefId?: string | null;
  pubmedId?: string | null;
  createdAt: Date;
}

export const citationMapper: RdfMapper<CitationEntity> = {
  entityType: "Citation",
  classUri: classUri("Citation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Citation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Citation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:paperId", entity.paperId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:paper", entity.paper, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.doi != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:doi", entity.doi, "xsd:string"));
    }
    if (entity.crossrefId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:crossrefId", entity.crossrefId, "xsd:string"));
    }
    if (entity.pubmedId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:pubmedId", entity.pubmedId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
