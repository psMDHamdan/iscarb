/**
 * ExperimentResult entity mapper — converts Prisma ExperimentResult to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ExperimentResultEntity {
  id: string;
  experimentId: string;
  experiment: string;
  variableId: string;
  variable: string;
  value: string;
  notes?: string | null;
  recordedAt: Date;
}

export const experimentResultMapper: RdfMapper<ExperimentResultEntity> = {
  entityType: "ExperimentResult",
  classUri: classUri("ExperimentResult"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ExperimentResult", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ExperimentResult")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:experimentId", entity.experimentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:experiment", entity.experiment, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:variableId", entity.variableId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:variable", entity.variable, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:recordedAt", entity.recordedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
