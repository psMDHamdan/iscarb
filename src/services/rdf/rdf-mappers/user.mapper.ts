import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

export const userMapper: RdfMapper<any> = {
  entityType: "User",
  classUri: classUri("User"),
  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("User", universityCode, entity.id);
    return { triples: [rdfTriple(uri, "rdf:type", classUri("User"))], graph: universityGraph(universityCode), uri };
  },
  fromTriples: () => ({}),
};
