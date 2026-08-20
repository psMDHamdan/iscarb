/**
 * LocalizationEntry entity mapper — converts Prisma LocalizationEntry to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LocalizationEntryEntity {
  id: string;
  key: string;
  locale: string;
  value: string;
  context?: string | null;
  updatedAt: Date;
}

export const localizationEntryMapper: RdfMapper<LocalizationEntryEntity> = {
  entityType: "LocalizationEntry",
  classUri: classUri("LocalizationEntry"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LocalizationEntry", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LocalizationEntry")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:key", entity.key, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:locale", entity.locale, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:string"));
    if (entity.context != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:context", entity.context, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
