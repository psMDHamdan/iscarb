/**
 * ExperimentVariable entity mapper — converts Prisma ExperimentVariable to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ExperimentVariableEntity {
  id: string;
  experimentId: string;
  experiment: string;
  name: string;
  type: string;
  unit?: string | null;
  description?: string | null;
  createdAt: Date;
}

export const experimentVariableMapper: RdfMapper<ExperimentVariableEntity> = {
  entityType: "ExperimentVariable",
  classUri: classUri("ExperimentVariable"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ExperimentVariable", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ExperimentVariable")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:experimentId", entity.experimentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:experiment", entity.experiment, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.unit != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:unit", entity.unit, "xsd:string"));
    }
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
