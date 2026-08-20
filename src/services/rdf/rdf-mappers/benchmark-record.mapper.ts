/**
 * BenchmarkRecord entity mapper — converts Prisma BenchmarkRecord to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface BenchmarkRecordEntity {
  id: string;
  benchmarkType: string;
  entityName: string;
  metric: string;
  value: number;
  period: string;
  createdAt: Date;
}

export const benchmarkRecordMapper: RdfMapper<BenchmarkRecordEntity> = {
  entityType: "BenchmarkRecord",
  classUri: classUri("BenchmarkRecord"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("BenchmarkRecord", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("BenchmarkRecord")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:benchmarkType", entity.benchmarkType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityName", entity.entityName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metric", entity.metric, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:period", entity.period, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
