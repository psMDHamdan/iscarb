/**
 * Competency entity mapper — converts Prisma Concept to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfTriple, rdfLiteralTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CompetencyEntity {
  id: string;
  name: string;
  cluster?: string | null;
}

export const competencyMapper: RdfMapper<CompetencyEntity> = {
  entityType: "Competency",
  classUri: classUri("Competency"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Competency", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Competency")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasName", entity.name, "xsd:string"),
    ];

    if (entity.cluster) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasCluster", entity.cluster, "xsd:string"));
    }

    return { graph, uri, triples };
  },

  fromTriples(triples) {
    const findVal = (p: string) => {
      const v = triples.find((t) => t.p === p)?.o;
      return typeof v === "object" ? v.value : v;
    };

    return {
      id: findVal("iscarb:hasId"),
      name: findVal("iscarb:hasName"),
      cluster: findVal("iscarb:hasCluster") || null,
    };
  },
};
