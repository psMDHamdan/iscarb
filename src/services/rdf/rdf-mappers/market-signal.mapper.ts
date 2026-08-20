/**
 * MarketSignal entity mapper — converts Prisma MarketSignal to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MarketSignalEntity {
  id: string;
  employer: string;
  sector: string;
  skill: string;
  demandIndex: number;
  trend: string;
  rolesOpen: number;
  vision2030: boolean;
  capturedAt: Date;
}

export const marketSignalMapper: RdfMapper<MarketSignalEntity> = {
  entityType: "MarketSignal",
  classUri: classUri("MarketSignal"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("MarketSignal", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("MarketSignal")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:employer", entity.employer, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sector", entity.sector, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skill", entity.skill, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:demandIndex", entity.demandIndex, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:trend", entity.trend, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:rolesOpen", entity.rolesOpen, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:vision2030", entity.vision2030, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:capturedAt", entity.capturedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
