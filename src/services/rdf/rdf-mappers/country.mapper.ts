/**
 * Country entity mapper — converts Prisma Country to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CountryEntity {
  id: string;
  code: string;
  name: string;
  nameAr?: string | null;
  phoneCode?: string | null;
  currency?: string | null;
  timezone?: string | null;
  createdAt: Date;
}

export const countryMapper: RdfMapper<CountryEntity> = {
  entityType: "Country",
  classUri: classUri("Country"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Country", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Country")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:code", entity.code, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.nameAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    }
    if (entity.phoneCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:phoneCode", entity.phoneCode, "xsd:string"));
    }
    if (entity.currency != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:currency", entity.currency, "xsd:string"));
    }
    if (entity.timezone != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:timezone", entity.timezone, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
