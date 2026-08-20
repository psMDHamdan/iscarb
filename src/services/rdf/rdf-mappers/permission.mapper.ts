import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, SYSTEM_GRAPH } from "@/config/rdf";

export const permissionMapper: RdfMapper<any> = {
  entityType: "Permission",
  classUri: classUri("Permission"),
  toTriples(entity): MapperResult {
    const uri = instanceUri("Permission", "system", entity.id);
    return { triples: [rdfTriple(uri, "rdf:type", classUri("Permission"))], graph: SYSTEM_GRAPH, uri };
  },
  fromTriples: () => ({}),
};
