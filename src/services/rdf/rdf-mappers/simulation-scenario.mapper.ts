/**
 * SimulationScenario entity mapper — converts Prisma SimulationScenario to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SimulationScenarioEntity {
  id: string;
  universityId: string;
  studentId: string;
  scenarioType: string;
  scenarioName: string;
  description?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
  outcome: string;
}

export const simulationScenarioMapper: RdfMapper<SimulationScenarioEntity> = {
  entityType: "SimulationScenario",
  classUri: classUri("SimulationScenario"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SimulationScenario", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SimulationScenario")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:scenarioType", entity.scenarioType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:scenarioName", entity.scenarioName, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:outcome", entity.outcome, "xsd:string"));

    return { triples, graph };
  },
};
