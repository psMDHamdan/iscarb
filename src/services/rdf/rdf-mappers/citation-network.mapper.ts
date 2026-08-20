/**
 * CitationNetwork entity mapper — converts Prisma CitationNetwork to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CitationNetworkEntity {
  id: string;
  paperId: string;
  citedPaperId: string;
  citationCount: number;
  discoveredAt: Date;
}

export const citationNetworkMapper: RdfMapper<CitationNetworkEntity> = {
  entityType: "CitationNetwork",
  classUri: classUri("CitationNetwork"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CitationNetwork", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CitationNetwork")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:paperId", entity.paperId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:citedPaperId", entity.citedPaperId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:citationCount", entity.citationCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:discoveredAt", entity.discoveredAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
