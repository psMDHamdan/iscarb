import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, SYSTEM_GRAPH } from "@/config/rdf";

interface ConceptEntity {
  id: string;
  name: string;
  cluster?: string | null;
  createdAt?: Date;
}

export const conceptMapper: RdfMapper<ConceptEntity> = {
  entityType: "Concept",
  classUri: classUri("Concept"),

  toTriples(entity, universityCode): MapperResult {
    // Concepts might be system-wide or per-university.
    // For now, mapping as system graph if universityCode isn't explicitly used
    const uri = instanceUri("Concept", universityCode || "system", entity.id);
    const graph = SYSTEM_GRAPH;

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Concept")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"),
    ];

    if (entity.cluster != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:cluster", entity.cluster, "xsd:string"));
    }

    if (entity.createdAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph, uri };
  },

  fromTriples(triples) {
    return {};
  },
};
