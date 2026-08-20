/**
 * ResearchSummary entity mapper — converts Prisma ResearchSummary to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchSummaryEntity {
  id: string;
  paperId: string;
  content: string;
  keyFindings?: string | null;
  methodology?: string | null;
  generatedAt: Date;
}

export const researchSummaryMapper: RdfMapper<ResearchSummaryEntity> = {
  entityType: "ResearchSummary",
  classUri: classUri("ResearchSummary"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchSummary", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchSummary")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:paperId", entity.paperId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.keyFindings != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:keyFindings", entity.keyFindings, "xsd:string"));
    }
    if (entity.methodology != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:methodology", entity.methodology, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:generatedAt", entity.generatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
