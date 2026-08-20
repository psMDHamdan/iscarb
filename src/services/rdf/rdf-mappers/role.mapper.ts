import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, SYSTEM_GRAPH } from "@/config/rdf";

export const roleMapper: RdfMapper<any> = {
  entityType: "Role",
  classUri: classUri("Role"),
  toTriples(entity): MapperResult {
    const uri = instanceUri("Role", "system", entity.id);
    return { triples: [rdfTriple(uri, "rdf:type", classUri("Role"))], graph: SYSTEM_GRAPH, uri };
  },
  fromTriples: () => ({}),
};
