/**
 * Simulation entity mapper — converts Prisma Simulation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SimulationEntity {
  id: string;
  unitId: string;
  unit: string;
  title: string;
  context: string;
  opening: string;
  successCriteria: string;
  company: string;
  role: string;
  payload: string;
  confidence: number;
  createdAt: Date;
}

export const simulationMapper: RdfMapper<SimulationEntity> = {
  entityType: "Simulation",
  classUri: classUri("Simulation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Simulation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Simulation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:unitId", entity.unitId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:unit", entity.unit, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:context", entity.context, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:opening", entity.opening, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:successCriteria", entity.successCriteria, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:company", entity.company, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:payload", entity.payload, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:confidence", entity.confidence, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
