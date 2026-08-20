/**
 * ExperimentVersion entity mapper — converts Prisma ExperimentVersion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ExperimentVersionEntity {
  id: string;
  experimentId: string;
  experiment: string;
  version: number;
  changes?: string | null;
  createdBy: string;
  createdAt: Date;
}

export const experimentVersionMapper: RdfMapper<ExperimentVersionEntity> = {
  entityType: "ExperimentVersion",
  classUri: classUri("ExperimentVersion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ExperimentVersion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ExperimentVersion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:experimentId", entity.experimentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:experiment", entity.experiment, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
    if (entity.changes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:changes", entity.changes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
