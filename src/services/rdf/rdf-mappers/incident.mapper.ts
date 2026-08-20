import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, SYSTEM_GRAPH } from "@/config/rdf";

interface IncidentEntity {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category: string;
  detectedAt?: Date;
}

export const incidentMapper: RdfMapper<IncidentEntity> = {
  entityType: "Incident",
  classUri: classUri("Incident"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Incident", universityCode || "system", entity.id);
    const graph = SYSTEM_GRAPH;

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Incident")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:severity", entity.severity, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"),
    ];

    if (entity.detectedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:detectedAt", entity.detectedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph, uri };
  },

  fromTriples(triples) {
    return {};
  },
};
