/**
 * PublicationMetric entity mapper — converts Prisma PublicationMetric to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PublicationMetricEntity {
  id: string;
  researcherId: string;
  metricType: string;
  value: number;
  period: string;
  calculatedAt: Date;
}

export const publicationMetricMapper: RdfMapper<PublicationMetricEntity> = {
  entityType: "PublicationMetric",
  classUri: classUri("PublicationMetric"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PublicationMetric", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PublicationMetric")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:researcherId", entity.researcherId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metricType", entity.metricType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:period", entity.period, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:calculatedAt", entity.calculatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
