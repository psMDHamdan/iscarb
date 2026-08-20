/**
 * DataQualityRecord entity mapper — converts Prisma DataQualityRecord to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DataQualityRecordEntity {
  id: string;
  domain: string;
  metric: string;
  score: number;
  totalRecords: number;
  validRecords: number;
  measuredAt: Date;
}

export const dataQualityRecordMapper: RdfMapper<DataQualityRecordEntity> = {
  entityType: "DataQualityRecord",
  classUri: classUri("DataQualityRecord"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DataQualityRecord", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DataQualityRecord")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:domain", entity.domain, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metric", entity.metric, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:totalRecords", entity.totalRecords, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:validRecords", entity.validRecords, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:measuredAt", entity.measuredAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
