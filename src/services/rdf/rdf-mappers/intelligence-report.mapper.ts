/**
 * IntelligenceReport entity mapper — converts Prisma IntelligenceReport to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface IntelligenceReportEntity {
  id: string;
  title: string;
  type: string;
  format: string;
  config: string;
}

export const intelligenceReportMapper: RdfMapper<IntelligenceReportEntity> = {
  entityType: "IntelligenceReport",
  classUri: classUri("IntelligenceReport"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("IntelligenceReport", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("IntelligenceReport")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:config", entity.config, "xsd:string"));

    return { triples, graph };
  },
};
