/**
 * EquityEvent entity mapper — converts Prisma EquityEvent to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface EquityEventEntity {
  id: string;
  ledgerId: string;
  label: string;
  valueDelta: number;
  scoreDelta: number;
  metaJson?: string | null;
  createdAt: Date;
}

export const equityEventMapper: RdfMapper<EquityEventEntity> = {
  entityType: "EquityEvent",
  classUri: classUri("EquityEvent"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("EquityEvent", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("EquityEvent")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:ledgerId", entity.ledgerId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:label", entity.label, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:valueDelta", entity.valueDelta, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:scoreDelta", entity.scoreDelta, "xsd:decimal"));
    if (entity.metaJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metaJson", entity.metaJson, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
